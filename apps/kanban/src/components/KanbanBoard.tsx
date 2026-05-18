'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useConnectivity } from '@/context/ConnectivityContext'
import { Task, TaskStatus, Profile } from '@/types/database'
import { KanbanBoardProps } from '@/types/ui'
import TaskModal from './TaskModal'
import KanbanOnboardingModal from './KanbanOnboardingModal'
import { KanbanColumn } from './kanban/KanbanColumn'
import { AlertCircle, RefreshCw, Plus } from 'lucide-react'
import { fetchGroupMembers, fetchGroupTasks } from '@/services/dashboard'
import { db } from '@/lib/db-client'
import { formatSupabaseError } from '@/utils/supabase-errors'
import {
  filterVisibleTasks,
  groupTasksByStatus,
  KANBAN_COLUMNS,
  normalizeTaskRow,
  removeTaskFromList,
  stabilizeTasksByColumn,
  upsertTaskList,
} from '@/lib/kanban/board-utils'
import '@/styles/kanban-tiles.css'

const KANBAN_HELP_BANNER_KEY = 'espeezy_kanban_help_banner_dismissed'
export default function KanbanBoard({ groupId, profile, newTaskSignal, onBoardReady }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [groupMembers, setGroupMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [helpBannerDismissed, setHelpBannerDismissed] = useState<boolean | null>(null)
  const [activeColumn, setActiveColumn] = useState<TaskStatus | undefined>()
  const isOnline = useConnectivity()

  const lastSignalRef = useRef(newTaskSignal)
  const boardReadySent = useRef(false)
  const columnsRef = useRef<Record<TaskStatus, Task[]> | null>(null)

  const membersById = useMemo(() => {
    const m = new Map<string, Profile>()
    for (const member of groupMembers) m.set(member.id, member)
    return m
  }, [groupMembers])

  const onlineUserIds = useMemo(
    () => new Set(groupMembers.map((m) => m.id)),
    [groupMembers],
  )

  const visibleTasks = useMemo(
    () => filterVisibleTasks(tasks, profile.id),
    [tasks, profile.id],
  )

  const tasksByColumn = useMemo(() => {
    const grouped = groupTasksByStatus(visibleTasks)
    const stable = stabilizeTasksByColumn(columnsRef.current, grouped)
    columnsRef.current = stable
    return stable
  }, [visibleTasks])

  const patchTask = useCallback((task: Task) => {
    setTasks((prev) => upsertTaskList(prev, task))
    setSelectedTask((prev) => (prev?.id === task.id ? task : prev))
  }, [])

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

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchGroupTasks(groupId)
      columnsRef.current = null
      setTasks(data.map(normalizeTaskRow))
      setError(null)
    } catch (err) {
      const message = formatSupabaseError(err, 'Failed to load tasks for this board.')
      console.error('Kanban load tasks:', message, err)
      setError(message)
    }
  }, [groupId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchGroupMembers(groupId)
      .then(setGroupMembers)
      .catch((err) => console.error('Kanban members:', formatSupabaseError(err)))

    void (async () => {
      await loadTasks()
      if (cancelled) return
      setLoading(false)
      if (!boardReadySent.current) {
        boardReadySent.current = true
        onBoardReady?.()
      }
    })()

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
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = normalizeTaskRow(payload.new as Task)
            setTasks((prev) => upsertTaskList(prev, row))
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldId = (payload.old as { id: string }).id
            setTasks((prev) => removeTaskFromList(prev, oldId))
          }
        },
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      cancelled = true
      db.removeChannel(channel)
    }
  }, [groupId, loadTasks, onBoardReady, profile.id])

  useEffect(() => {
    try {
      setHelpBannerDismissed(localStorage.getItem(KANBAN_HELP_BANNER_KEY) === '1')
    } catch {
      setHelpBannerDismissed(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsOnboardingOpen(true)
    window.addEventListener('open-kanban-onboarding', handler)
    return () => window.removeEventListener('open-kanban-onboarding', handler)
  }, [])

  const refreshTasks = useCallback(async () => {
    await loadTasks()
  }, [loadTasks])

  useEffect(() => {
    if (!groupId || !profile.id) return
    let cancelled = false

    fetch('/api/onboarding/ensure', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    })
      .then(async (res) => {
        if (!res.ok || cancelled) return
        const body = (await res.json()) as { seeded?: number }
        if ((body.seeded ?? 0) > 0) await refreshTasks()
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [groupId, profile.id, refreshTasks])

  const dismissHelpBanner = useCallback(() => {
    setHelpBannerDismissed(true)
    try {
      localStorage.setItem(KANBAN_HELP_BANNER_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  const handleTaskSaved = useCallback(
    (saved?: Task) => {
      if (saved) patchTask(saved)
      setIsModalOpen(false)
    },
    [patchTask],
  )

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
          onClick={() => {
            setLoading(true)
            void loadTasks().finally(() => setLoading(false))
          }}
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
      {helpBannerDismissed === false && (
        <button
          type="button"
          aria-label="Dismiss How to use Kanban hint"
          title="Click to close"
          onClick={dismissHelpBanner}
          data-testid="kanban-help-banner"
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
            fontWeight: 700,
            fontSize: '0.97rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} aria-hidden="true" style={{ transform: 'rotate(45deg)' }} />
          <span>How to use Kanban</span>
        </button>
      )}

      <div className="kanban-board-root" role="region" aria-label="Kanban board">
        {KANBAN_COLUMNS.map((col) => (
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
          onTaskPatched={patchTask}
          onTaskSaved={handleTaskSaved}
          onlineUserIds={onlineUserIds}
        />
      )}

      {isOnboardingOpen && <KanbanOnboardingModal onClose={() => setIsOnboardingOpen(false)} />}
    </div>
  )
}
