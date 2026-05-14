'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle, Search, X, RefreshCw, CloudOff } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useConnectivity, ConnectivityProvider } from './ConnectivityContext'
import { PresenceProvider } from './PresenceProvider'
import type { Task, TaskStatus, Profile, KanbanBoardProps } from './types'
import TaskModal from './TaskModal'
import { distributeTaskScore } from './actions'
import TeamChat from './TeamChat'
import { logActivity } from './logging'
import './kanban.css'

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done']
const MIN_DRAG_MS = 150

export default function KanbanBoard(props: KanbanBoardProps) {
  if (!props.groupId) return <div>Invalid Group</div>;

  return (
    <ConnectivityProvider>
      <PresenceProvider user={props.profile} groupId={props.groupId}>
        <KanbanBoardContent {...props} />
      </PresenceProvider>
    </ConnectivityProvider>
  )
}

function KanbanBoardContent({ groupId, profile, newTaskSignal }: KanbanBoardProps) {
  const router = useRouter();
  const { isOnline } = useConnectivity()

  const [storageTasks, setStorageTasks] = useState<Task[]>([])
  const [boardSearch, setBoardSearch] = useState('');
  const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [boardError, setBoardError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const [activeDragColumn, setActiveDragColumn] = useState<TaskStatus | null>(null)
  const dragStartTimeRef = useRef<number>(0)

  const reconcileTasks = useCallback((dbTasks: Task[]) => {
    setStorageTasks((prev) => {
      const previousById = new Map(prev.map((task) => [task.id, task]))
      return dbTasks.map((task) => {
        if (!pendingUpdates.has(task.id)) return task
        return previousById.get(task.id) ?? task
      })
    })
  }, [pendingUpdates])

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
  }, [groupId, reconcileTasks, storageTasks?.length]);

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
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (data) {
      reconcileTasks(data as Task[]);
    }
  }, [groupId, reconcileTasks])

  const fetchGroupMembers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('group_id', groupId)

    if (data) {
      setGroupMembers(data as Profile[])
    }
  }, [groupId])

  const fetchCurrentUser = useCallback(async () => {
    if (profile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setCurrentUserProfile(data as Profile)
    }
  }, [profile])

  useEffect(() => {
    let active = true
    let channel: any = null

    const initialize = async () => {
      await Promise.all([
        fetchTasksFromDB(),
        fetchGroupMembers(),
        fetchCurrentUser()
      ])
      
      if (!active) return

      channel = supabase.channel(`kanban_${groupId}`)
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
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchTasksFromDB, fetchGroupMembers, fetchCurrentUser, groupId])

  useEffect(() => {
    if (typeof newTaskSignal === 'number' && newTaskSignal > 0) {
      void Promise.resolve().then(() => {
        setSelectedTask(null)
        setIsModalOpen(true)
      })
    }
  }, [newTaskSignal])

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
    dragStartTimeRef.current = Date.now()
    setDraggingCardId(taskId)
  }

  const handleDragEnd = () => {
    setDraggingCardId(null)
    setActiveDragColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setActiveDragColumn(col)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setActiveDragColumn(null)
    }
  }

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    setStorageTasks((prev) => prev.map((task) => (
      task.id === taskId ? { ...task, status: newStatus } : task
    )))
  }, [])

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setActiveDragColumn(null)

    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return

    const elapsed = Date.now() - dragStartTimeRef.current
    if (elapsed < MIN_DRAG_MS) {
      setDraggingCardId(null)
      return
    }

    setDraggingCardId(null)
    setPendingUpdates(prev => new Set(prev).add(taskId))

    await moveTask(taskId, newStatus)
    handleDragEnd()

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      console.error('Failed to move task in DB', error)
      setBoardError(`Persistence error: ${error.message}`)
      setTimeout(() => setBoardError(null), 5000)
      
      setPendingUpdates(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
      await fetchTasksFromDB()
      return
    }

    setPendingUpdates(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })

    void fetchTasksFromDB()

    if (newStatus === 'Done') {
      const targetTask = storageTasks.find((t: Task) => t.id === taskId)
      if (targetTask && targetTask.assignees) {
        distributeTaskScore(taskId, targetTask.assignees).catch(err => console.error('Score Distribution error', err))
      }
    }

    const userId = currentUserProfile?.id || profile?.id;
    if (userId) {
      logActivity(
        userId,
        groupId,
        'task_updated',
        `Moved task to ${newStatus}`,
        { task_id: taskId, new_status: newStatus }
      )
    }
  }

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

      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>Project Progress</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                {groupMembers.slice(0, 6).map((user, idx) => {
                  return (
                    <div
                      key={user.id}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid #0f172a',
                        backgroundColor: '#10b981',
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
              {groupMembers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.8rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {groupMembers.length} Team {groupMembers.length === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
              )}
            </div>
          </div>
          {overdueCount > 0 && (
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              <AlertCircle size={14} /> {overdueCount} Critical Tasks
            </span>
          )}
        </div>
        <div style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ width: `${globalProbability}%`, height: '100%', backgroundColor: globalProbability < 30 ? '#ef4444' : '#10b981', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>Velocity: <span style={{ color: 'white', fontWeight: 900 }}>{globalProbability}%</span></span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>{storageTasks?.length || 0} Tasks</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
          <input 
            type="text" 
            placeholder="Search system tasks..." 
            value={boardSearch}
            onChange={(e) => setBoardSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', 
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', 
              fontSize: '0.8rem', outline: 'none', transition: 'all 0.2s', fontWeight: 600
            }}
          />
          {boardSearch && (
            <button 
              onClick={() => setBoardSearch('')}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              Node Verified
            </div>
          <button onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} style={{ background: '#10b981', color: 'white', border: 'none', width: 'auto', fontWeight: 900, padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
            + Create Task
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', minHeight: '70vh' }}>
        {COLUMNS.map((col) => (
          <div
            key={col}
            style={{
              background: 'rgba(15, 23, 42, 0.3)',
              borderRadius: '12px',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ fontWeight: 850, fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem', borderBottom: '2px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.25rem' }}>
              <span>{col}</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.6)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                {filteredTasks.filter((t: Task) => t.status === col).length}
              </span>
            </div>

             <div
               style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '150px', padding: '0.25rem' }}
               onDragOver={(e) => handleDragOver(e, col)}
               onDragLeave={handleDragLeave}
               onDrop={(e) => handleDrop(e, col)}
             >
                  {tasksByStatus[col].map((task: Task) => {
                    const isDraggingThis = draggingCardId === task.id

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e as any, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                        style={{
                          background: 'rgba(30, 41, 59, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          cursor: isDraggingThis ? 'grabbing' : 'grab',
                          opacity: isDraggingThis ? 0.4 : 1,
                          position: 'relative',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                     <div style={{ fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 700, color: 'white' }}>{task.title}</div>

                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>Completion</span>
                        <span style={{ color: calculateProbability(task) < 30 ? '#ef4444' : 'rgba(255, 255, 255, 0.4)' }}>
                          {calculateProbability(task)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', height: '2px', borderRadius: '2px' }}>
                        <div style={{ width: `${calculateProbability(task)}%`, height: '100%', backgroundColor: calculateProbability(task) < 30 ? '#ef4444' : calculateProbability(task) === 100 ? '#10b981' : '#0ea5e9', borderRadius: '2px', transition: 'width 0.4s ease' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(14, 165, 233, 0.1)',
                            color: '#0ea5e9',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 800
                          }}
                        >
                          {task.category || 'Legacy'}
                        </span>
                        
                        {pendingUpdates.has(task.id) && (
                          <span style={{ 
                            fontSize: '0.6rem', color: '#10b981', fontWeight: 900, textTransform: 'uppercase', 
                            display: 'flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '0.5px' 
                          }}>
                            <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} />
                            Vault Sync
                          </span>
                        )}
                        
                        {!isOnline && (
                          <span style={{ 
                            fontSize: '0.6rem', color: '#ef4444', fontWeight: 900, textTransform: 'uppercase', 
                            display: 'flex', alignItems: 'center', gap: '0.25rem' 
                          }}>
                            <CloudOff size={10} />
                            Local Mode
                          </span>
                        )}
                        {task.due_date && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: new Date(task.due_date).getTime() < Date.now() && task.status !== 'Done' ? '#ef4444' : 'rgba(255, 255, 255, 0.4)' }}>
                            Due: {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '40%' }}>
                        {(!task.assignees || task.assignees.length === 0) ? (
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>Unassigned</span>
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
                                  position: 'relative', padding: 0, background: 'none', border: 'none', cursor: 'pointer'
                                }}
                              >
                                {user?.avatar_url ? (
                                  <Image
                                    src={user.avatar_url}
                                    alt={user.full_name || 'View Profile'}
                                    width={20}
                                    height={20}
                                    style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                                  />
                                ) : (
                                  <div
                                    title={user?.full_name || 'View Profile'}
                                    style={{
                                      width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#10b981', color: 'white',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold',
                                      border: '1px solid rgba(255, 255, 255, 0.1)'
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
          onlineUserIds={new Set([profile?.id].filter(Boolean) as string[])}
        />
      )}
      
      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
