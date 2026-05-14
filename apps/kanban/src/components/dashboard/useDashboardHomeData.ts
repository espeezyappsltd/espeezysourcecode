import { useCallback, useEffect, useState } from 'react'
import { Group, Profile } from '@/types/database'
import {
  fetchGroupById,
  fetchGroupMembers,
  fetchGroupTasks,
  fetchPendingJoinRequests,
  fetchPersonalPendingTaskCount,
} from '@/services/dashboard'

type AddToast = (title: string, description: string, variant: 'success' | 'error' | 'info') => void

type ViewerProfile = {
  id?: string | null
  role?: string | null
}

export interface JoinRequest {
  id: string
  group_id: string
  user_id: string
  status: string
  created_at: string
  profiles?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export function useDashboardHomeData(groupId: string, profile: ViewerProfile | null | undefined, addToast: AddToast) {
  const [personalTaskCount, setPersonalTaskCount] = useState(0)
  const [group, setGroup] = useState<Group | null>(null)
  const [newTaskSignal, setNewTaskSignal] = useState(0)
  const [syncToken, setSyncToken] = useState(0)
  const [members, setMembers] = useState<Profile[]>([])
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([])
  const [showMembers, setShowMembers] = useState(false)
  const [projectProgress, setProjectProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('Starting up')
  const [totalBacklog, setTotalBacklog] = useState(0)

  useEffect(() => {
    if (!groupId) return
    try {
      const cachedGroup = localStorage.getItem(`gf_cache_group_${groupId}`)
      const cachedStats = localStorage.getItem(`gf_cache_stats_${groupId}`)

      if (cachedGroup) {
        const parsedGroup = JSON.parse(cachedGroup) as Group
        queueMicrotask(() => setGroup(parsedGroup))
      }
      if (cachedStats) {
        const stats = JSON.parse(cachedStats)
        queueMicrotask(() => {
          setPersonalTaskCount(stats.personal || 0)
          setTotalBacklog(stats.backlog || 0)
          setProjectProgress(stats.progress || 0)
          setProgressLabel(stats.label || 'Just a moment...')
        })
      }
    } catch (e) {
      console.warn('Cache hydration failed defensively:', e)
    }
  }, [groupId])

  const fetchGroupDetails = useCallback(async () => {
    try {
      const data = await fetchGroupById(groupId)
      setGroup(data)
      localStorage.setItem(`gf_cache_group_${groupId}`, JSON.stringify(data))
    } catch (err) {
      console.error('Fetch group details error:', err instanceof Error ? err.message : err)
    }
  }, [groupId])

  const fetchMembers = useCallback(async () => {
    if (!groupId) return
    try {
      const data = await fetchGroupMembers(groupId)
      setMembers(data)
    } catch (err) {
      console.error('Error fetching group members:', err instanceof Error ? err.message : err)
    }
  }, [groupId])

  const fetchPendingRequests = useCallback(async () => {
    if (!groupId || profile?.role !== 'admin') return
    try {
      const data = await fetchPendingJoinRequests(groupId)
      setPendingRequests(data.map((request) => ({ ...request, profiles: request.profiles ?? undefined })))
    } catch (err) {
      console.error('Fetch pending requests error:', err instanceof Error ? err.message : err)
    }
  }, [groupId, profile?.role])

  const handleAcceptRequest = async (id: string) => {
    const { acceptJoinRequest } = await import('@/app/join/actions')
    const res = await acceptJoinRequest(id)
    if (res.error) {
      addToast('Oops, something went wrong', "We couldn't add the member right now. Let's try again.", 'error')
      return
    }

    addToast('All set!', 'Your teammate is now in the group.', 'success')
    void fetchMembers()
    void fetchPendingRequests()
  }

  const handleDeclineRequest = async (id: string) => {
    const { declineJoinRequest } = await import('@/app/join/actions')
    const res = await declineJoinRequest(id)
    if (res.error) {
      addToast('Slight issue', "We couldn't update the request. Please try again.", 'error')
      return
    }

    addToast('Request updated', 'The join request has been removed.', 'info')
    void fetchPendingRequests()
  }

  const fetchPersonalTaskCount = useCallback(async () => {
    if (!profile?.id || !groupId) return
    try {
      const pendingCount = await fetchPersonalPendingTaskCount(groupId, profile.id)
      setPersonalTaskCount(pendingCount)
    } catch (err) {
      console.warn('Silent failure on personal task count:', err instanceof Error ? err.message : err)
    }
  }, [profile?.id, groupId])

  const fetchProjectProgress = useCallback(async () => {
    if (!groupId) return
    try {
      const tasks = await fetchGroupTasks(groupId)

      if (tasks.length === 0) {
        setProjectProgress(0)
        setProgressLabel('Empty Backlog')
        setTotalBacklog(0)
        return
      }

      type Task = { status: string }
      const pending = tasks.filter((t: Task) => t.status !== 'Done').length
      setTotalBacklog(pending)

      const completed = tasks.filter((t: Task) => t.status === 'Done').length
      const progress = Math.round((completed / tasks.length) * 100)
      setProjectProgress(progress)

      let label = 'Almost finished'
      if (progress <= 30) label = 'Just starting'
      else if (progress <= 50) label = 'Making progress'
      else if (progress <= 80) label = 'Smoothing things out'

      setProgressLabel(label)

      localStorage.setItem(`gf_cache_stats_${groupId}`, JSON.stringify({
        personal: personalTaskCount,
        backlog: pending,
        progress,
        label,
      }))
    } catch (err) {
      console.error('Fetch project progress error:', err instanceof Error ? err.message : err)
    }
  }, [groupId, personalTaskCount])

  useEffect(() => {
    if (!groupId) return

    const initializeDashboardData = async () => {
      const tasks: Promise<unknown>[] = [
        fetchGroupDetails(),
        fetchMembers(),
        fetchPendingRequests(),
      ]

      if (profile?.id) {
        tasks.push(fetchPersonalTaskCount())
        tasks.push(fetchProjectProgress())
      }

      await Promise.all(tasks)
    }

    void initializeDashboardData()

    const pollId = window.setInterval(() => {
      void initializeDashboardData()
    }, 20000)

    return () => {
      window.clearInterval(pollId)
    }
  }, [
    profile?.id,
    groupId,
    fetchGroupDetails,
    fetchMembers,
    fetchPendingRequests,
    fetchPersonalTaskCount,
    fetchProjectProgress,
  ])

  return {
    personalTaskCount,
    group,
    newTaskSignal,
    setNewTaskSignal,
    syncToken,
    setSyncToken,
    members,
    pendingRequests,
    showMembers,
    setShowMembers,
    projectProgress,
    progressLabel,
    totalBacklog,
    handleAcceptRequest,
    handleDeclineRequest,
  }
}
