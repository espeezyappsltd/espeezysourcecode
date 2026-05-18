'use client'

import { useRouter } from 'next/navigation'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TaskModalProps } from '@/types/ui'
import { Profile } from '@/types/auth'
import { Task, TaskStatus, Artifact, TaskCategory } from '@/types/database'
import { logActivity } from '@/utils/logging'
import { taskSchema } from '@/utils/validation'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { celebrateOnboardingComplete } from '@/lib/onboarding/celebrate'
import type { OnboardingCompletionResult } from '@/lib/onboarding/onboarding-service'
import { getOnboardingTourAction } from '@/lib/onboarding/dashboard-tasks'
import { isPersistedTaskId } from '@/lib/tasks/task-ids'

export type UseTaskModalReturn = {
  isEditMode: boolean
  onlineUsers: Set<string>
  title: string
  setTitle: Dispatch<SetStateAction<string>>
  description: string
  setDescription: Dispatch<SetStateAction<string>>
  status: TaskStatus
  setStatus: Dispatch<SetStateAction<TaskStatus>>
  category: TaskCategory
  setCategory: Dispatch<SetStateAction<TaskCategory>>
  assignees: string[]
  dueDate: string
  setDueDate: Dispatch<SetStateAction<string>>
  members: Profile[]
  loading: boolean
  error: string | null
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  aiLoading: boolean
  aiError: string | null
  artifacts: Artifact[]
  evidenceLoading: boolean
  newUrl: string
  setNewUrl: Dispatch<SetStateAction<string>>
  uploading: boolean
  currentUser: { id: string } | null
  task: Task | null | undefined
  onboardingTour: ReturnType<typeof getOnboardingTourAction>
  onClose: () => void
  onProfileClick: (userId: string) => void
  handleSave: () => Promise<void>
  handleDelete: () => Promise<void>
  handleAIGenerate: () => Promise<void>
  toggleMemberAssignment: (memberId: string) => Promise<void>
  handleUploadEvidence: () => Promise<void>
  handlePhysicalUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>
  handleDeleteArtifact: (artifactId: string) => Promise<void>
  handleEndorse: (artifactId: string, currentCount: number) => Promise<void>
}

export function useTaskModal({
  task,
  groupId,
  onClose,
  onRefresh,
  onTaskPatched,
  onTaskSaved,
  initialDueDate,
  initialStatus,
  onlineUserIds,
}: TaskModalProps): UseTaskModalReturn {
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const router = useRouter()

  const onlineUsers = onlineUserIds ?? new Set<string>()
  const isEditMode = isPersistedTaskId(task?.id)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? initialStatus ?? 'To Do')
  const [category, setCategory] = useState<TaskCategory>(task?.category ?? 'Implementation')
  const [assignees, setAssignees] = useState<string[]>(task?.assignees ?? [])
  const [dueDate, setDueDate] = useState<string>(
    task?.due_date ? task.due_date.substring(0, 10) : initialDueDate ?? '',
  )
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [members, setMembers] = useState<Profile[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [evidenceLoading, setEvidenceLoading] = useState(isEditMode)
  const [newUrl, setNewUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let active = true

    db.auth.getUser().then(({ data }) => {
      if (!active) return
      setCurrentUser(data.user ? { id: data.user.id } : null)
    })

    const { data: authSub } = db.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setCurrentUser(session?.user ? { id: session.user.id } : null)
    })

    const loadMembers = async () => {
      const { data, error: loadErr } = await db.from('profiles').select('*').eq('group_id', groupId)

      if (!active) return
      if (loadErr) {
        console.error('Members load error:', loadErr.message)
        return
      }

      setMembers((data ?? []) as Profile[])
    }

    loadMembers()

    const channel = db
      .channel(`task-modal-members:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `group_id=eq.${groupId}` },
        () => loadMembers(),
      )
      .subscribe()

    return () => {
      active = false
      authSub.subscription.unsubscribe()
      db.removeChannel(channel)
    }
  }, [db, groupId])

  useEffect(() => {
    if (!isEditMode || !task || !isPersistedTaskId(task.id)) {
      setArtifacts([])
      setEvidenceLoading(false)
      return
    }

    let active = true
    const loadArtifacts = async () => {
      const { data, error: loadErr } = await db
        .from('artifacts')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false })

      if (!active) return
      if (loadErr) {
        console.error('Artifacts load error:', loadErr.message)
        setEvidenceLoading(false)
        return
      }

      setArtifacts((data ?? []) as Artifact[])
      setEvidenceLoading(false)
    }

    loadArtifacts()

    const channel = db
      .channel(`task-artifacts:${task.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artifacts', filter: `task_id=eq.${task.id}` },
        () => loadArtifacts(),
      )
      .subscribe()

    return () => {
      active = false
      db.removeChannel(channel)
    }
  }, [db, isEditMode, task])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    setLoading(true)
    const payloadTask = {
      title: title.trim(),
      description,
      status,
      category,
      assignees,
      group_id: groupId,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    }

    const validation = taskSchema.safeParse(payloadTask)
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      setLoading(false)
      return
    }

    const persistedId = isPersistedTaskId(task?.id) ? task.id : undefined

    const payload = {
      action: isEditMode && persistedId ? 'update' : 'create',
      task: {
        ...(persistedId ? { id: persistedId } : {}),
        ...payloadTask,
      },
    }

    const optimisticTask: Task = {
      ...(task ?? {
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
        score_awarded: false,
        is_coding_task: false,
      }),
      ...payloadTask,
      group_id: groupId,
    } as Task

    if (persistedId) {
      onTaskPatched?.(optimisticTask)
    }

    try {
      const response = await fetch('/api/task/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as {
        error?: string
        task?: Task
        onboarding?: OnboardingCompletionResult | null
      }
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save task.')
      }

      if (data.onboarding?.rewardGranted) {
        celebrateOnboardingComplete(data.onboarding)
      }

      const saved = (data.task ?? optimisticTask) as Task
      onTaskPatched?.(saved)
      await onTaskSaved?.(saved)
      onClose()
    } catch (err: unknown) {
      try {
        if (isEditMode && task?.id) {
          const { error: updateError } = await db.from('tasks').update(payloadTask).eq('id', task.id)
          if (updateError) throw updateError
        } else {
          const { error: insertError } = await db.from('tasks').insert(payloadTask)
          if (insertError) throw insertError
        }
        onTaskPatched?.(optimisticTask)
        await onTaskSaved?.(optimisticTask)
        onClose()
        return
      } catch (fallbackErr: unknown) {
        const primary = err instanceof Error ? err.message : String(err)
        const secondary = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        setError(`Failed to save task: ${secondary || primary}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!title.trim()) {
      setAiError('Give the task a title first so AI can generate a good description.')
      return
    }

    setAiLoading(true)
    setAiError(null)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          category,
          dueDate,
          existingDescription: description,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate AI description.')
      }

      setDescription(data.description)
      setAiError(null)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unable to generate AI description.'
      setAiError(message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !isPersistedTaskId(task.id)) return
    if (!confirm('Are you absolutely sure you want to permanently delete this task?')) return

    setLoading(true)
    try {
      const { error: deleteError } = await db.from('tasks').delete().eq('id', task.id)

      if (deleteError) throw deleteError

      await onRefresh()
      await onTaskSaved?.()

      if (currentUser) {
        logActivity(currentUser.id, groupId, 'task_deleted', `Deleted task: ${task.title}`)
      }
      onClose()
    } catch (err) {
      setError(`Failed to delete: ${err instanceof Error ? err.message : err}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleMemberAssignment = async (memberId: string) => {
    const isCurrentlyAssigned = assignees.includes(memberId)
    const newAssignees = isCurrentlyAssigned ? assignees.filter((id) => id !== memberId) : [...assignees, memberId]

    setAssignees(newAssignees)

    if (isEditMode && task && isPersistedTaskId(task.id)) {
      setLoading(true)
      const patched = { ...task, assignees: newAssignees }
      onTaskPatched?.(patched)
      try {
        const { error: updateErr } = await db.from('tasks').update({ assignees: newAssignees }).eq('id', task.id)

        if (updateErr) throw updateErr
      } catch (err) {
        setError(`Failed to update assignment: ${err instanceof Error ? err.message : err}`)
        setAssignees(task.assignees ?? [])
      }
      setLoading(false)
    }
  }

  const handleUploadEvidence = async () => {
    if (!newUrl || !task || !isPersistedTaskId(task.id)) return
    setUploading(true)
    setError(null)

    if (!currentUser) {
      setError('Not authenticated.')
      setUploading(false)
      return
    }

    try {
      const { error: insertErr } = await db.from('artifacts').insert({
        task_id: task.id,
        file_url: newUrl,
        uploaded_by: currentUser.id,
        endorsements_count: 0,
        created_at: new Date().toISOString(),
      })

      if (insertErr) throw insertErr

      logActivity(currentUser.id, groupId, 'artifact_uploaded', `Attached a link to task`, { task_id: task.id })
      setNewUrl('')
    } catch (err) {
      setError(`Failed to attach evidence: ${err instanceof Error ? err.message : err}`)
    } finally {
      setUploading(false)
    }
  }

  const handlePhysicalUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file || !task || !isPersistedTaskId(task.id) || !currentUser) return
      setUploading(true)
      setError(null)

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `task-evidence/${task.id}/evidence-${Date.now()}-${safeName}`

      const { error: uploadError } = await db.storage.from('espeezy-assets').upload(filePath, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = db.storage.from('espeezy-assets').getPublicUrl(filePath)

      const { error: insertError } = await db.from('artifacts').insert({
        task_id: task.id,
        file_url: data.publicUrl,
        uploaded_by: currentUser.id,
        endorsements_count: 0,
        created_at: new Date().toISOString(),
      })

      if (insertError) throw insertError
    } catch (err) {
      setError(`File upload failed: ${err instanceof Error ? err.message : err}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteArtifact = async (artifactId: string) => {
    try {
      const { error: deleteErr } = await db.from('artifacts').delete().eq('id', artifactId)

      if (deleteErr) throw deleteErr

      if (currentUser) {
        logActivity(currentUser.id, groupId, 'artifact_uploaded', `Removed an attachment from task`, {
          task_id: task?.id || 'deleted',
        })
      }
    } catch (err) {
      setError(`Failed to delete artifact: ${err instanceof Error ? err.message : err}`)
    }
  }

  const onboardingTour = useMemo(() => getOnboardingTourAction(description), [description])

  const handleEndorse = async (artifactId: string, currentCount: number) => {
    try {
      const { error: updateErr } = await db
        .from('artifacts')
        .update({ endorsements_count: currentCount + 1 })
        .eq('id', artifactId)

      if (updateErr) throw updateErr
    } catch (err) {
      setError(`Failed to endorse: ${err instanceof Error ? err.message : err}`)
    }
  }

  const onProfileClick = useCallback(
    (userId: string) => {
      router.push(`/network/profile/${userId}`)
    },
    [router],
  )

  return {
    isEditMode,
    onlineUsers,
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    category,
    setCategory,
    assignees,
    dueDate,
    setDueDate,
    members,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    aiLoading,
    aiError,
    artifacts,
    evidenceLoading,
    newUrl,
    setNewUrl,
    uploading,
    currentUser,
    task,
    onboardingTour,
    onClose,
    onProfileClick,
    handleSave,
    handleDelete,
    handleAIGenerate,
    toggleMemberAssignment,
    handleUploadEvidence,
    handlePhysicalUpload,
    handleDeleteArtifact,
    handleEndorse,
  }
}
