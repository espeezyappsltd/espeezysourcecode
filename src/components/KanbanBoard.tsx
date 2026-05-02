'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { FileUp, GitCommit, AlertCircle, Search, X, RefreshCw, CloudOff } from 'lucide-react'
import { useConnectivity } from '@/context/ConnectivityContext'
import { Task, TaskStatus } from '@/types/database'
import { Profile } from '@/types/auth'
import { KanbanBoardProps } from '@/types/ui'
import TaskModal from './TaskModal'
import confetti from 'canvas-confetti'
import { distributeTaskScore } from '@/app/dashboard/actions'
import TeamChat from './TeamChat'
import { logActivity } from '@/utils/logging'
import MemberProfileModal from './MemberProfileModal'
import {
  RoomProvider,
  useStorage,
  useMutation,
  useMyPresence,
  useOthers,
  useUpdateMyPresence,
  ChatMessage,
  QuizQuestion,
  QuizScore
} from "@/liveblocks.config";
import { LiveList, LiveObject } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done']

// Minimum drag duration (ms) before a drop is accepted.
// Prevents accidental fast flicks and ensures intentional placement.
const MIN_DRAG_MS = 150

// How long the lock-snap animation class stays active (ms).
// Slightly longer than the CSS animation (0.45s / 450ms) to ensure full playback.
const LOCK_SNAP_DURATION_MS = 500

export default function KanbanBoard({ groupId, profile, newTaskSignal }: KanbanBoardProps) {
  if (!groupId) return <div>Invalid Group</div>;

  return (
    <RoomProvider
      id={groupId}
      initialPresence={{ draggingTaskId: null, userName: profile?.full_name || 'Someone' }}
      initialStorage={{ 
        tasks: new LiveList<Task>([]), 
        messages: new LiveList<ChatMessage>([]),
        quizQuestions: new LiveList<QuizQuestion>([]),
        quizScores: new LiveList<QuizScore>([]),
        quizStatus: 'setup',
        currentQuestionIndex: 0,
        activeTurnUserId: null,
        gameId: null,
        roundStartTime: 0,
        timerDuration: 60,
        config: new LiveObject({
          difficulty: 'intermediate' as const,
          mode: 'classic' as const
        })
      }}
    >
      <ClientSideSuspense fallback={<KanbanBoardSkeleton />}>
        {() => <KanbanBoardContent groupId={groupId} profile={profile} newTaskSignal={newTaskSignal} />}
      </ClientSideSuspense>
    </RoomProvider>
  )
}


function KanbanBoardContent({ groupId, profile, newTaskSignal }: KanbanBoardProps) {
  const router = useRouter();
  const db = createBrowserSupabaseClient();
  const { isOnline, isSlow } = useConnectivity()
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  const othersDragging = useOthers((others) => others.filter(other => other.presence.draggingTaskId !== null));
  const storageTasks = useStorage((root) => root.tasks);

  const [boardSearch, setBoardSearch] = useState('');
  const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [boardError, setBoardError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Drag UX state
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const [droppingTaskId, setDroppingTaskId] = useState<string | null>(null)
  const [activeDragColumn, setActiveDragColumn] = useState<TaskStatus | null>(null)
  const dragStartTimeRef = useRef<number>(0)

  // Reconcile Liveblocks Storage with Supabase Data
  const reconcileTasks = useMutation(({ storage }, dbTasks: Task[]) => {
    const liveTasks = storage.get("tasks");

    // 1. Add missing tasks and update existing ones
    dbTasks.forEach(dbTask => {
      // SKIP reconciliation if the task is currently being updated locally
      if (pendingUpdates.has(dbTask.id)) return;

      const index = liveTasks.findIndex(t => t.id === dbTask.id);
      if (index === -1) {
        liveTasks.push(dbTask);
      } else {
        const liveTask = liveTasks.get(index)
        if (liveTask && JSON.stringify(liveTask) !== JSON.stringify(dbTask)) {
          liveTasks.set(index, dbTask)
        }
      }
    });

    // 2. Remove deleted tasks (optional, but good for robustness)
    const dbTaskIds = new Set(dbTasks.map(t => t.id));
    for (let i = liveTasks.length - 1; i >= 0; i--) {
      const liveTask = liveTasks.get(i);
      if (liveTask && !dbTaskIds.has(liveTask.id)) {
        liveTasks.delete(i);
      }
    }
  }, []);

  // 0. BLAZING SPEED CACHE: Load from LocalStorage for instant perception
  useEffect(() => {
    const cached = localStorage.getItem(`gf_kanban_cache_${groupId}`);
    if (cached && !storageTasks?.length) {
      try {
        const parsed = JSON.parse(cached);
        reconcileTasks(parsed);
      } catch (e) {
        console.error("Cache Hydration Failed", e);
      }
    }
  }, [groupId]); // Run once on mount

  // Persistence Sync
  useEffect(() => {
    if (storageTasks?.length) {
      localStorage.setItem(`gf_kanban_cache_${groupId}`, JSON.stringify(Array.from(storageTasks)));
    }
  }, [storageTasks, groupId]);


  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  const fetchTasksFromDB = useCallback(async () => {
    if (storageTasks == null) return;
    const { data } = await db
      .from('tasks')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (data) {
      reconcileTasks(data as Task[]);
    }
  }, [db, groupId, reconcileTasks, storageTasks])

  const fetchGroupMembers = useCallback(async () => {
    const { data } = await db
      .from('profiles')
      .select('*')
      .eq('group_id', groupId)

    if (data) {
      setGroupMembers(data as Profile[])
    }
  }, [db, groupId])

  const fetchCurrentUser = useCallback(async () => {
    if (profile) return
    const { data: { user } } = await db.auth.getUser()
    if (user) {
      const { data } = await db.from('profiles').select('*').eq('id', user.id).single()
      if (data) setCurrentUserProfile(data)
    }
  }, [db, profile])

  useEffect(() => {
    let active = true
    let channel: ReturnType<typeof db.channel> | null = null

    const initialize = async () => {
      // Parallelize fetches to eliminate waterfalls
      await Promise.all([
        fetchTasksFromDB(),
        fetchGroupMembers(),
        fetchCurrentUser()
      ])
      
      if (!active) return

      channel = db.channel(`kanban_${groupId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `group_id=eq.${groupId}` },
          () => {
            fetchTasksFromDB()
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `group_id=eq.${groupId}` },
          () => {
            fetchGroupMembers()
          }
        )
        .subscribe()
    }

    void initialize()

    return () => {
      active = false
      if (channel) db.removeChannel(channel)
    }
  }, [fetchTasksFromDB, fetchGroupMembers, fetchCurrentUser, groupId, db])

  useEffect(() => {
    if (typeof newTaskSignal === 'number' && newTaskSignal > 0) {
      void Promise.resolve().then(() => {
        setSelectedTask(null)
        setIsModalOpen(true)
      })
    }
  }, [newTaskSignal])

  // Collaborative Handlers (Liveblocks)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
    // eslint-disable-next-line react-hooks/purity
    dragStartTimeRef.current = Date.now()
    setDraggingCardId(taskId)
    updateMyPresence({ draggingTaskId: taskId });
  }

  const handleDragEnd = () => {
    setDraggingCardId(null)
    setActiveDragColumn(null)
    updateMyPresence({ draggingTaskId: null });
  }

  const handleDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setActiveDragColumn(col)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear when leaving the column entirely, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setActiveDragColumn(null)
    }
  }

  const moveTask = useMutation(({ storage }, taskId: string, newStatus: TaskStatus) => {
    const liveTasks = storage.get("tasks");
    const index = liveTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = liveTasks.get(index);
      if (task) {
        liveTasks.set(index, { ...task, status: newStatus });
      }
    }
  }, []);

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setActiveDragColumn(null)

    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return

    // Throttle: require intentional drag before accepting the drop
    const elapsed = Date.now() - dragStartTimeRef.current
    if (elapsed < MIN_DRAG_MS) {
      setDraggingCardId(null)
      return
    }

    setDraggingCardId(null)

     // Optimistically update the shared UI while persisting to DB.

    // Track this update as pending to avoid "snap-back" during reconciliation
    setPendingUpdates(prev => new Set(prev).add(taskId))

    // Optimistically update the shared UI while persisting to DB.
    moveTask(taskId, newStatus)
    handleDragEnd()

    const { error } = await db
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      console.error('Failed to move task in DB', error)
      setBoardError(`Persistence error: ${error.message}`)
      setTimeout(() => setBoardError(null), 5000)
      
      // Remove from pending and force a refresh to revert optimism
      setPendingUpdates(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
      await fetchTasksFromDB()
      return
    }

    // Clear pending update
    setPendingUpdates(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })

    // Debounced sync for consistency without flicker
    void fetchTasksFromDB()

    if (newStatus === 'Done') {
      const targetTask = storageTasks ? Array.from(storageTasks).find((t: Task) => t.id === taskId) : undefined
      if (targetTask && targetTask.assignees) {
        distributeTaskScore(taskId, targetTask.assignees).catch(err => console.error('Score Distribution error', err))
      }
      // Mini confetti burst on task completion — colors resolved from CSS variables
      const brandColor = typeof document !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#10b981'
        : '#10b981'
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: [brandColor, '#34d399', '#6ee7b7', '#ffffff'],
        scalar: 0.9,
        ticks: 60
      })
    }

    if (currentUserProfile || profile) {
      logActivity(
        (currentUserProfile?.id || profile?.id)!,
        groupId,
        'task_updated',
        `Moved task to ${newStatus}`,
        { task_id: taskId, new_status: newStatus }
      )
    }
  }

  const addTask = useMutation(({ storage }, newTask: Task) => {
    storage.get("tasks").push(newTask);
  }, []);

  const updateTask = useMutation(({ storage }, updatedTask: Task) => {
    const liveTasks = storage.get("tasks");
    const index = liveTasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      liveTasks.set(index, updatedTask);
    }
  }, []);

  // FILTERED TASKS
  const filteredTasks = useMemo(() => {
    if (!storageTasks) return []
    const raw = Array.from(storageTasks)
    if (!boardSearch.trim()) return raw
    const term = boardSearch.toLowerCase()
    return raw.filter(t => 
      t.title.toLowerCase().includes(term) || 
      t.description?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term)
    )
  }, [storageTasks, boardSearch])
 
  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      'To Do': [],
      'In Progress': [],
      'In Review': [],
      'Done': []
    }
    filteredTasks.forEach(t => {
      if (map[t.status]) map[t.status].push(t)
    })
    return map
  }, [filteredTasks])

  const calculateProbability = (task: Task) => {
    if (task.status === 'Done') return 100
    let base = task.status === 'In Review' ? 85 : task.status === 'In Progress' ? 50 : 10
    const artifactBoost = Math.min((task.artifacts?.length || 0) * 5, 15)
    base += artifactBoost
    if (task.due_date) {
      const remainingHours = (new Date(task.due_date).getTime() - now) / (1000 * 60 * 60)
      if (remainingHours < 0) base = Math.max(0, base - 50)
      else if (remainingHours < 48) base = Math.max(0, base - 10)
    }
    return Math.min(base, 99)
  }

  const globalProbability = (filteredTasks && filteredTasks.length > 0)
    ? Math.round(filteredTasks.reduce((acc, t) => acc + calculateProbability(t), 0) / filteredTasks.length)
    : 0

  const overdueCount = filteredTasks.filter((t: Task) => t.due_date && new Date(t.due_date).getTime() < now && t.status !== 'Done').length
  const [hasCelebrated, setHasCelebrated] = useState(false)

  // Gamification
  useEffect(() => {
    const sessionKey = `celebrated_${groupId}`
    const alreadyCelebrated = sessionStorage.getItem(sessionKey)

    if (storageTasks && storageTasks.length > 0 && globalProbability === 100 && !hasCelebrated && !alreadyCelebrated) {
      void Promise.resolve().then(() => {
        setHasCelebrated(true)
        sessionStorage.setItem(sessionKey, 'true')
      })
      const duration = 3000
      const end = Date.now() + duration
      const frame = () => {
        confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#ffffff'] })
        confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#ffffff'] })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    } else if (storageTasks && storageTasks.length > 0 && globalProbability < 100) {
      void Promise.resolve().then(() => {
        setHasCelebrated(false)
      })
      sessionStorage.removeItem(sessionKey)
    }
  }, [globalProbability, storageTasks?.length, hasCelebrated, groupId])
  if (storageTasks == null) {
    return <div>Loading board...</div>;
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {boardError && (
        <div className="error-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{boardError}</span>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={fetchTasksFromDB}>
            Retry Sync
          </button>
        </div>
      )}

      {/* Master Milestone HUD */}
      <div style={{ backgroundColor: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Project Progress</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent)' }}>
                {others.map((other, idx) => {
                  const presence = other.presence as { userName?: string } | undefined
                  const user = groupMembers.find(m => m.id === other.id) || { full_name: presence?.userName || 'Someone', avatar_url: '' }
                  return (
                    <div
                      key={other.connectionId}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-sub)',
                        backgroundColor: 'var(--brand)',
                        marginLeft: idx === 0 ? 0 : '-8px',
                        zIndex: 10 - idx,
                        position: 'relative'
                      }}
                      title={`${user.full_name} is active`}
                    >
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={`${user.full_name} avatar`} width={24} height={24} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>
                          {(user.full_name || '?')[0]}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {others.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.8rem', background: 'var(--bg-main)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {others.length} Team {others.length === 1 ? 'Node' : 'Nodes'} Active
                  </span>
                </div>
              )}
            </div>
          </div>
          {overdueCount > 0 && (
            <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <AlertCircle size={14} /> {overdueCount} Critical Tasks
            </span>
          )}
        </div>
        <div style={{ width: '100%', backgroundColor: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ width: `${globalProbability}%`, height: '100%', backgroundColor: globalProbability < 30 ? 'var(--error)' : 'var(--brand)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 700 }}>Velocity: <span style={{ color: 'var(--text-main)', fontWeight: 900 }}>{globalProbability}%</span></span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 700 }}>{storageTasks?.length || 0} Tasks</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
          <input 
            type="text" 
            placeholder="Search system tasks..." 
            value={boardSearch}
            onChange={(e) => setBoardSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', 
              background: 'var(--bg-sub)', border: '1px solid var(--border)', color: 'var(--text-main)', 
              fontSize: '0.8rem', outline: 'none', transition: 'all 0.2s', fontWeight: 600
            }}
            className="search-focus"
          />
          {boardSearch && (
            <button 
              onClick={() => setBoardSearch('')}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="hide-mobile">
              <div className="pulse-pill" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
              Node Verified
            </div>
          <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} style={{ width: 'auto', fontWeight: 900, padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
            + Create Task
          </button>
        </div>
      </div>

      <div className="kanban-board scroll-x-allowed">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className={`kanban-column ${activeDragColumn === col ? 'kanban-column-active' : ''}`}
          >
            <div className="kanban-column-header">
              <span>{col}</span>
              <span className="badge" style={{ backgroundColor: 'var(--bg-sub)', color: 'var(--text-sub)' }}>
                {filteredTasks.filter((t: Task) => t.status === col).length}
              </span>
            </div>

             <div
               className="kanban-task-list"
               onDragOver={(e) => handleDragOver(e, col)}
               onDragLeave={handleDragLeave}
               onDrop={(e) => handleDrop(e, col)}
             >
                 {tasksByStatus[col].map((task: Task) => {
                   const draggingOther = othersDragging.find(o => o.presence?.draggingTaskId === task.id)
                   const isDraggingThis = draggingCardId === task.id

                   return (
                     <div
                       key={task.id}
                       className={`kanban-card ${draggingOther ? 'remote' : ''} ${isDraggingThis ? 'dragging' : ''}`}
                       draggable
                       onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, task.id)}
                       onDragEnd={handleDragEnd}
                       onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                       style={{
                         position: 'relative',
                         border: draggingOther ? '2px solid var(--brand)' : '1px solid var(--border)',
                         padding: '0.5rem',
                         cursor: isDraggingThis ? 'grabbing' : 'grab',
                         opacity: isDraggingThis ? 0.4 : 1,
                       }}
                     >
                    {draggingOther && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '10px',
                        backgroundColor: 'var(--brand)',
                        color: 'white',
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        boxShadow: '0 2px 10px rgba(var(--brand-rgb), 0.3)',
                        zIndex: 2,
                        animation: 'pulse 2s infinite'
                      }}>
                        {((draggingOther.presence as { userName?: string })?.userName) || 'A teammate'} is moving this
                      </div>
                    )}
                     <div className="kanban-card-title" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>{task.title}</div>

                    {/* COMPACT PROGRESS BAR */}
                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>Completion</span>
                        <span style={{ color: calculateProbability(task) < 30 ? 'var(--error)' : 'var(--text-sub)' }}>
                          {calculateProbability(task)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: 'var(--bg-sub)', height: '2px', borderRadius: '2px' }}>
                        <div style={{ width: `${calculateProbability(task)}%`, height: '100%', backgroundColor: calculateProbability(task) < 30 ? 'var(--error)' : calculateProbability(task) === 100 ? 'var(--success)' : 'var(--brand)', borderRadius: '2px', transition: 'width 0.4s ease' }}></div>
                      </div>
                    </div>

                    <div className="kanban-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          className="badge"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: task.category === 'Implementation' ? 'rgba(var(--brand-rgb), 0.1)' :
                              task.category === 'Architecture' ? 'rgba(139, 92, 246, 0.1)' :
                                task.category === 'UX/UI Design' ? 'rgba(236, 72, 153, 0.1)' :
                                  task.category === 'Quality Assurance' ? 'rgba(10, 185, 129, 0.1)' :
                                    task.category === 'Research' ? 'rgba(245, 158, 11, 0.1)' :
                                      task.category === 'Mentorship' ? 'rgba(99, 102, 241, 0.1)' :
                                        task.category === 'Documentation' ? 'rgba(100, 116, 139, 0.1)' :
                                          task.category === 'DevOps' ? 'rgba(6, 182, 212, 0.1)' :
                                            'rgba(239, 68, 68, 0.1)',
                            color: task.category === 'Implementation' ? 'var(--brand)' :
                              task.category === 'Architecture' ? '#8b5cf6' :
                                task.category === 'UX/UI Design' ? '#ec4899' :
                                  task.category === 'Quality Assurance' ? '#10b981' :
                                    task.category === 'Research' ? '#f59e0b' :
                                      task.category === 'Mentorship' ? '#6366f1' :
                                        task.category === 'Documentation' ? '#64748b' :
                                          task.category === 'DevOps' ? '#06b6d4' :
                                            'var(--error)',
                            border: 'none',
                            fontSize: '0.65rem',
                            fontWeight: 800
                          }}
                        >
                          {task.category || 'Legacy'}
                        </span>
                        
                        {pendingUpdates.has(task.id) && (
                          <span style={{ 
                            fontSize: '0.6rem', color: 'var(--brand)', fontWeight: 900, textTransform: 'uppercase', 
                            display: 'flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '0.5px' 
                          }}>
                            <RefreshCw size={10} className="spin" />
                            Vault Sync
                          </span>
                        )}
                        
                        {!isOnline && (
                          <span style={{ 
                            fontSize: '0.6rem', color: 'var(--error)', fontWeight: 900, textTransform: 'uppercase', 
                            display: 'flex', alignItems: 'center', gap: '0.25rem' 
                          }}>
                            <CloudOff size={10} />
                            Local Mode
                          </span>
                        )}
                        {task.due_date && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: new Date(task.due_date).getTime() < Date.now() && task.status !== 'Done' ? 'var(--error)' : 'var(--text-sub)' }}>
                            Due: {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '40%' }}>
                        {(!task.assignees || task.assignees.length === 0) ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>Unassigned</span>
                        ) : (
                          task.assignees.map((userId: string) => {
                            const user = groupMembers.find(m => m.id === userId)
                            const initial = user?.full_name ? user.full_name.substring(0, 1).toUpperCase() : '?'

                            return (
                              <button
                                key={userId}
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  router.push(`/dashboard/network/profile/${userId}`);
                                }}
                                style={{
                                  position: 'relative', padding: 0, background: 'none', border: 'none', cursor: 'pointer',
                                  transition: 'transform 0.2s'
                                }}
                                className="avatar-bubble"
                              >
                                {user?.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    title={user.full_name || 'View Profile'}
                                    style={{
                                      width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover',
                                      border: '1px solid var(--surface)', boxShadow: 'var(--shadow-sm)'
                                    }}
                                  />
                                ) : (
                                  <div
                                    title={user?.full_name || 'View Profile'}
                                    style={{
                                      width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'white',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold',
                                      border: '1px solid var(--surface)', boxShadow: 'var(--shadow-sm)'
                                    }}
                                  >
                                    {initial}
                                  </div>
                                )}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                     </div>
                   )
                 })}
             </div>
          </div>
        ))}

        {groupId && (currentUserProfile || profile) && (
          <TeamChat groupId={groupId} user={(currentUserProfile || profile)!} />
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          groupId={groupId}
          onRefresh={fetchTasksFromDB}
          onTaskSaved={fetchTasksFromDB}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedTask(null)
          }}
          onlineUserIds={new Set([...others.map(o => o.id), profile?.id].filter(Boolean) as string[])}
        />
      )}

      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          groupMembers={groupMembers}
          tasks={filteredTasks}
          onClose={() => setSelectedMember(null)}
        />
      )}

      <style jsx>{`
        .avatar-bubble:hover { transform: scale(1.1) translateY(-1px); z-index: 10; filter: brightness(1.1); }
        .kanban-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gap-md); min-height: 70vh; }
        @media (max-width: 1024px) {
          .kanban-board { display: flex; overflow-x: auto; padding-bottom: 1rem; }
          .kanban-column { flex: 0 0 calc(90vw); }
        }
        .kanban-column {
          background: var(--bg-main);
          border-radius: var(--radius);
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: var(--gap-md);
          border: 1px solid var(--border);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .kanban-column-active {
          border-color: var(--brand) !important;
          background: rgba(var(--brand-rgb), 0.03) !important;
          box-shadow: 0 0 0 2px rgba(var(--brand-rgb), 0.15), inset 0 0 20px rgba(var(--brand-rgb), 0.04) !important;
        }
        .kanban-column-header {
          font-weight: 850;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-sub);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem;
          border-bottom: 2px solid var(--border);
          margin-bottom: 0.25rem;
        }
        .kanban-task-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          min-height: 150px;
          padding: 0.25rem;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .kanban-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.5rem;
          cursor: grab;
          box-shadow: var(--shadow-sm);
          user-select: none;
          -webkit-user-select: none;
        }
        .kanban-card:hover {
          border-color: var(--brand);
          box-shadow: 0 4px 16px rgba(var(--brand-rgb), 0.15), var(--shadow-sm);
          transform: translateY(-2px);
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .kanban-card-title { font-weight: 700; font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.25rem; line-height: 1.3; }
         .remote-dragging { pointer-events: none; opacity: 0.7; filter: grayscale(0.5); }
      `}</style>
    </div>
  )
}

function KanbanBoardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', marginTop: '1rem' }}>
      <div className="skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton skeleton-title" style={{ width: '30%' }} />
        <div className="skeleton" style={{ width: '100px', height: '38px', borderRadius: '14px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton skeleton-title" style={{ width: '40%', height: '1.2rem' }} />
            <div className="skeleton skeleton-card" style={{ height: '120px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
