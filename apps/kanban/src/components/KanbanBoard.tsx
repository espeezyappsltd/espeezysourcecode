'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useConnectivity } from '@/context/ConnectivityContext'
import { Task, TaskStatus, Profile } from '@/types/database'
import { KanbanBoardProps } from '@/types/ui'
import TaskModal from './TaskModal'
import KanbanOnboardingModal from './KanbanOnboardingModal'
import { KanbanColumn } from './kanban/KanbanColumn'
import { AlertCircle, RefreshCw, Plus } from 'lucide-react'
import { fetchGroupMembers } from '@/services/dashboard'
import { db } from '@/lib/db-client'
import { Q } from '@/lib/query-columns'
import '@/styles/kanban-tiles.css'

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done']

const TASK_SELECT = `${Q.task}, category`

function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const map: Record<TaskStatus, Task[]> = {
    'To Do': [],
    'In Progress': [],
    'In Review': [],
    Done: [],
  }
  for (const t of tasks) {
    if (map[t.status]) map[t.status].push(t)
  }
  return map
}

export default function KanbanBoard({ groupId, profile, newTaskSignal, onBoardReady }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [groupMembers, setGroupMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [activeColumn, setActiveColumn] = useState<TaskStatus | undefined>()
  const isOnline = useConnectivity()

  const lastSignalRef = useRef(newTaskSignal)
  const boardReadySent = useRef(false)

  const membersById = useMemo(() => {
    const m = new Map<string, Profile>()
    for (const member of groupMembers) m.set(member.id, member)
    return m
  }, [groupMembers])

  const tasksByColumn = useMemo(() => groupTasksByStatus(tasks), [tasks])

  const openModal = useCallback((task: Task | null, column?: TaskStatus) => {
    setSelectedTask(task)
    if (column) setActiveColumn(column)
    setIsModalOpen(true)
  }, [])

  const handleOpenTask = useCallback((task: Task) => openModal(task), [openModal])
  const handleAddTask = useCallback((status: TaskStatus) => openModal(null, status), [openModal])

  useEffect(() => {
    if (newTaskSignal !== undefined && newTaskSignal > (lastSignalRef.current || 0)) {
      openModal(null, 'To Do')
    }
    lastSignalRef.current = newTaskSignal
  }, [newTaskSignal, openModal])

  useEffect(() => {
    setLoading(true)
    fetchGroupMembers(groupId).then(setGroupMembers).catch(console.error)

    const channel = db
      .channel(`kanban-tasks-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [...prev, payload.new as Task])
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t)))
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldId = (payload.old as { id: string }).id
            setTasks((prev) => prev.filter((t) => t.id !== oldId))
          }
        },
      )
      .on('presence', { event: 'sync' }, () => {
        window.dispatchEvent(new CustomEvent('presence-sync', { detail: channel.presenceState() }))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setLoading(false)
          await channel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    db.from('tasks')
      .select(TASK_SELECT)
      .eq('group_id', groupId)
      .then(({ data }) => {
        if (data) setTasks(data as unknown as Task[])
        setLoading(false)
        if (!boardReadySent.current) {
          boardReadySent.current = true
          onBoardReady?.()
        }
      })

    return () => {
      db.removeChannel(channel)
    }
  }, [groupId, profile.id])

  useEffect(() => {
    const handler = () => setIsOnboardingOpen(true)
    window.addEventListener('open-kanban-onboarding', handler)
    return () => window.removeEventListener('open-kanban-onboarding', handler)
  }, [])

  const refreshTasks = useCallback(async () => {
    const { data } = await db.from('tasks').select(TASK_SELECT).eq('group_id', groupId)
    if (data) setTasks(data as unknown as Task[])
  }, [groupId])

  if (loading) {
    return (
      <div role="status" aria-busy="true" style={{ padding: '2rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" style={{ margin: '0 auto', color: '#10b981' }} aria-hidden="true" />
        <div>Loading board…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle style={{ marginBottom: 8 }} aria-hidden="true" />
        {error}
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginLeft: 16,
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }} data-testid="kanban-board">
      {!isOnline && (
        <p role="status" style={{ fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>
          Offline — changes sync when reconnected.
        </p>
      )}
      <button
        type="button"
        aria-label="How to use Kanban Board"
        title="How to use Kanban Board"
        onClick={() => setIsOnboardingOpen(true)}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 20,
          background: 'rgba(59,130,246,0.09)',
          border: '1px solid rgba(59,130,246,0.18)',
          borderRadius: 12,
          padding: '0.5rem 0.8rem',
          color: '#2563eb',
          fontWeight: 900,
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
        }}
      >
        <Plus size={18} aria-hidden="true" style={{ transform: 'rotate(45deg)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.97rem' }}>How to use Kanban</span>
      </button>

      <div className="kanban-board-root" role="region" aria-label="Kanban board">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col}
            status={col}
            tasks={tasksByColumn[col]}
            membersById={membersById}
            onAddTask={handleAddTask}
            onOpenTask={handleOpenTask}
          />
        ))}
      </div>

      {isModalOpen && (
        <TaskModal
          task={selectedTask || undefined}
          groupId={groupId}
          initialStatus={activeColumn}
          onClose={() => setIsModalOpen(false)}
          onRefresh={refreshTasks}
          onTaskSaved={async () => {
            await refreshTasks()
            setIsModalOpen(false)
          }}
          onlineUserIds={new Set(groupMembers.map((m) => m.id))}
        />
      )}

      {isOnboardingOpen && <KanbanOnboardingModal onClose={() => setIsOnboardingOpen(false)} />}
    </div>
  )
}
