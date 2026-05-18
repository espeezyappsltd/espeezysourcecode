import { createBrowserSupabaseClient } from '@/lib/db-client'
import { Q } from '@/lib/query-columns'
import type { Group, Profile, Task } from '@/types/database'

export type JoinRequestWithProfile = {
  id: string
  group_id: string
  user_id: string
  status: string
  created_at: string
  profiles?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

export type DashboardNotificationSettings = {
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
}

export async function getAuthUser() {
  const db = createBrowserSupabaseClient()
  const { data } = await db.auth.getUser()
  return data.user ?? null
}

export async function fetchProfileById(userId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, email, username, avatar_url, role, subscription_plan, tier, group_id, total_score, email_notifications, push_notifications, marketing_emails, course_name, enrollment_year, completion_year, created_at, updated_at')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as unknown as Profile
}

export async function updateProfileById(userId: string, updates: Record<string, unknown>) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

export async function fetchGroupById(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('groups').select(Q.group).eq('id', groupId).single()
  if (error) throw error
  return data as unknown as Group
}

export async function updateGroupById(groupId: string, updates: Record<string, unknown>) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('groups').update(updates).eq('id', groupId)
  if (error) throw error
}

export async function fetchGroupsOrderedByName() {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('groups').select(Q.group).order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Group[]
}

export async function fetchGroupMembers(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('profiles').select(Q.profile.groupMember).eq('group_id', groupId)
  if (error) throw error
  return (data ?? []) as unknown as Profile[]
}

export async function fetchGroupMembersByScore(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('profiles')
    .select(Q.profile.groupMember)
    .eq('group_id', groupId)
    .order('total_score', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Profile[]
}

export async function fetchProfilesByIds(ids: string[]) {
  const safeIds = Array.from(new Set(ids)).filter(Boolean)
  if (safeIds.length === 0) return [] as Profile[]

  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('profiles').select(Q.profile.card).in('id', safeIds)
  if (error) throw error
  return (data ?? []) as unknown as Profile[]
}

export async function fetchGroupTasks(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('tasks').select(Q.task).eq('group_id', groupId)
  if (error) throw error
  return (data ?? []) as unknown as Task[]
}

export async function fetchPersonalPendingTaskCount(groupId: string, userId: string) {
  const db = createBrowserSupabaseClient()
  const { count, error } = await db
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .contains('assignees', [userId])
    .neq('status', 'Done')
  if (error) throw error
  return count ?? 0
}

export async function fetchPendingJoinRequests(groupId: string): Promise<JoinRequestWithProfile[]> {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('group_join_requests')
    .select('id, group_id, user_id, status, created_at')
    .eq('group_id', groupId)
    .eq('status', 'pending')
  if (error) throw error

  const requests = (data ?? []) as JoinRequestWithProfile[]
  if (requests.length === 0) return []

  const userIds = Array.from(new Set(requests.map((request) => request.user_id))).filter(Boolean)
  if (userIds.length === 0) return requests

  const { data: profiles, error: profileError } = await db
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)
  if (profileError) throw profileError

  const profileMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>(
    (profiles ?? []).map((profile: any) => [
      profile.id,
      {
        id: profile.id,
        full_name: profile.full_name ?? null,
        avatar_url: profile.avatar_url ?? null,
      },
    ]),
  )
  return requests.map((request) => ({
    ...request,
    profiles: profileMap.get(request.user_id) ?? null,
  }))
}

export async function fetchArtifactsByGroup(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('artifacts').select(Q.artifact).eq('group_id', groupId)
  if (error) throw error
  return data ?? []
}

export async function fetchArtifactsByUser(userId: string, rowLimit = 3) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('artifacts')
    .select(Q.artifact)
    .eq('uploaded_by', userId)
    .order('created_at', { ascending: false })
    .limit(rowLimit)
  if (error) throw error
  return data ?? []
}

export async function fetchCommitsByUser(userId: string, rowLimit = 3) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('commits')
    .select(Q.commit)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(rowLimit)
  if (error) throw error
  return data ?? []
}

export async function fetchActivityLogByGroup(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('activity_log')
    .select(Q.activityLog)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}

export async function fetchNotificationSettings(userId: string): Promise<DashboardNotificationSettings> {
  const profile = await fetchProfileById(userId)
  return {
    email_notifications: (profile as any).email_notifications ?? true,
    push_notifications: (profile as any).push_notifications ?? true,
    marketing_emails: (profile as any).marketing_emails ?? false,
  }
}

export async function updateNotificationSetting(userId: string, key: keyof DashboardNotificationSettings, value: boolean) {
  await updateProfileById(userId, { [key]: value })
}

export async function createUserFeedback(userId: string, message: string, category: string) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('user_feedback').insert({
    user_id: userId,
    message,
    category,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function fetchMessagesForUser(userId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('messages')
    .select(Q.message)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}

export async function fetchConnectionRecords(userA: string, userB: string) {
  const db = createBrowserSupabaseClient()

  const [first, second] = await Promise.all([
    db.from('user_connections').select(Q.userConnection).eq('user_id', userA).eq('target_id', userB),
    db.from('user_connections').select(Q.userConnection).eq('user_id', userB).eq('target_id', userA),
  ])

  if (first.error) throw first.error
  if (second.error) throw second.error

  return [...(first.data ?? []), ...(second.data ?? [])]
}

export async function upsertPendingConnectionRequest(userId: string, targetId: string) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('user_connections').upsert(
    {
      user_id: userId,
      target_id: targetId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,target_id' },
  )
  if (error) throw error
}

export async function createNotification(payload: {
  user_id: string
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('notifications').insert({
    ...payload,
    read: false,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function deleteConnectionRecord(userA: string, userB: string) {
  const db = createBrowserSupabaseClient()

  const [first, second] = await Promise.all([
    db.from('user_connections').delete().eq('user_id', userA).eq('target_id', userB),
    db.from('user_connections').delete().eq('user_id', userB).eq('target_id', userA),
  ])

  if (first.error) throw first.error
  if (second.error) throw second.error
}

export async function setConnectionAccepted(userA: string, userB: string) {
  const db = createBrowserSupabaseClient()
  const now = new Date().toISOString()

  const { error } = await db.from('user_connections').upsert(
    [
      { user_id: userA, target_id: userB, status: 'accepted', created_at: now, updated_at: now },
      { user_id: userB, target_id: userA, status: 'accepted', created_at: now, updated_at: now },
    ],
    { onConflict: 'user_id,target_id' },
  )

  if (error) throw error
}

export async function fetchUserGameStats(userId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('user_game_stats').select(Q.userGameStats).eq('user_id', userId).single()
  if (error) return null
  return data
}

export async function upsertUserGameStats(userId: string, stats: Record<string, unknown>) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('user_game_stats').upsert(
    {
      user_id: userId,
      ...stats,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

export async function createGameSession(payload: Record<string, unknown>) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('game_sessions').insert(payload)
  if (error) throw error
}
