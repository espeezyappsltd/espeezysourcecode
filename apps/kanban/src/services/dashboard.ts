import { createBrowserSupabaseClient } from '@/lib/db-client'
import type { Group, Profile, Task, Artifact, Commit, ActivityLog } from '@/types/database'

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
  if (userId === '00000000-0000-0000-0000-000000000000') {
    return {
      id: userId,
      full_name: 'Test User',
      subscription_plan: 'pro',
      group_id: '00000000-0000-0000-0000-000000000000',
      theme_config: { palette: 'Google Light' }
    } as unknown as Profile
  }
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('profiles').select('id, email, full_name, avatar_url, course_name, enrollment_year, completion_year, role, rank, badges_count, school_id, group_id, subscription_plan, subscription_status, subscription_started_at, total_score, created_at, tagline, biography, stack, last_seen, storage_used').eq('id', userId).maybeSingle()
  if (error) throw error
  return data as Profile
}

export async function updateProfileById(userId: string, updates: Record<string, unknown>) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

export async function fetchGroupById(groupId: string) {
  if (groupId === '00000000-0000-0000-0000-000000000000') {
    return {
      id: groupId,
      name: 'Mock Group',
      module_code: 'MOCK101',
      is_encrypted: false,
      description: 'This is a mock group for development.',
      rules: 'Be kind.',
      capacity: 10,
      created_at: new Date().toISOString()
    } as unknown as Group
  }
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('groups').select('id, name, module_code, is_encrypted, description, rules, capacity, created_at').eq('id', groupId).maybeSingle()
  if (error) throw error
  return data as Group
}

export async function updateGroupById(groupId: string, updates: Record<string, unknown>) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('groups').update(updates).eq('id', groupId)
  if (error) throw error
}

export async function fetchGroupsOrderedByName() {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('groups').select('id, name, module_code, is_encrypted, description, rules, capacity, created_at').order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Group[]
}

export async function fetchGroupMembers(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('profiles').select('id, email, full_name, avatar_url, course_name, enrollment_year, completion_year, role, rank, badges_count, school_id, group_id, subscription_plan, subscription_status, subscription_started_at, total_score, created_at, tagline, biography, stack, last_seen').eq('group_id', groupId)
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function fetchGroupMembersByScore(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('profiles')
    .select('id, email, full_name, avatar_url, course_name, enrollment_year, completion_year, role, rank, badges_count, school_id, group_id, subscription_plan, subscription_status, subscription_started_at, total_score, created_at, tagline, biography, stack, last_seen')
    .eq('group_id', groupId)
    .order('total_score', { ascending: false })
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function fetchProfilesByIds(ids: string[]) {
  const safeIds = Array.from(new Set(ids)).filter(Boolean)
  if (safeIds.length === 0) return [] as Profile[]

  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('profiles').select('id, email, full_name, avatar_url, course_name, enrollment_year, completion_year, role, rank, badges_count, school_id, group_id, subscription_plan, subscription_status, subscription_started_at, total_score, created_at, tagline, biography, stack, last_seen').in('id', safeIds)
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function fetchGroupTasks(groupId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('tasks').select('id, title, description, status, category, assignees, group_id, is_coding_task, due_date, created_at').eq('group_id', groupId)
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function fetchPersonalPendingTaskCount(groupId: string, userId: string) {
  const tasks = await fetchGroupTasks(groupId)
  return tasks.filter((task) => Array.isArray(task.assignees) && task.assignees.includes(userId) && task.status !== 'Done').length
}

export async function createTask(task: Partial<Task>) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('tasks').insert(task).select().single()
  if (error) throw error
  return data as Task
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('tasks').update(updates).eq('id', taskId).select().single()
  if (error) throw error
  return data as Task
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
    (profiles ?? []).map((profile) => [
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

export async function fetchArtifactsByGroup(groupId: string): Promise<Artifact[]> {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db.from('artifacts').select('id, task_id, group_id, file_url, uploaded_by, endorsements_count, created_at').eq('group_id', groupId)
  if (error) throw error
  return (data ?? []) as Artifact[]
}

export async function fetchArtifactsByUser(userId: string, rowLimit = 3): Promise<Artifact[]> {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('artifacts')
    .select('id, task_id, group_id, file_url, uploaded_by, endorsements_count, created_at')
    .eq('uploaded_by', userId)
    .order('created_at', { ascending: false })
    .limit(rowLimit)
  if (error) throw error
  return (data ?? []) as Artifact[]
}

export async function fetchCommitsByUser(userId: string, rowLimit = 3): Promise<Commit[]> {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('commits')
    .select('hash, message, lines_added, lines_deleted, author_email, author_id, task_id, impact_score, created_at')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(rowLimit)
  if (error) throw error
  return (data ?? []) as Commit[]
}

export async function fetchActivityLogByGroup(groupId: string): Promise<ActivityLog[]> {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('activity_logs')
    .select('id, user_id, group_id, action, details, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ActivityLog[]
}

export async function fetchNotificationSettings(userId: string): Promise<DashboardNotificationSettings> {
  const profile = await fetchProfileById(userId)
  if (!profile) {
    return {
      email_notifications: true,
      push_notifications: true,
      marketing_emails: false,
    }
  }
  return {
    email_notifications: profile.email_notifications ?? true,
    push_notifications: profile.push_notifications ?? true,
    marketing_emails: profile.marketing_emails ?? false,
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
  const { data, error } = await db.from('messages').select('id, user_id, content, created_at, group_id').eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function fetchConnectionRecords(userA: string, userB: string) {
  const db = createBrowserSupabaseClient()

  const [first, second] = await Promise.all([
    db.from('user_connections').select('id, user_id, target_id, status, created_at, updated_at').eq('user_id', userA).eq('target_id', userB),
    db.from('user_connections').select('id, user_id, target_id, status, created_at, updated_at').eq('user_id', userB).eq('target_id', userA),
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
  const { data, error } = await db.from('user_game_stats').select('user_id, total_games, wins, losses, current_streak, best_streak, total_points, updated_at').eq('user_id', userId).single()
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

/** ── TEAM MANAGEMENT ────────────────────────────────────────────── */

export async function createTeam(name: string, description: string, ownerId: string) {
  const db = createBrowserSupabaseClient()
  
  // 1. Create Team
  const { data: team, error: teamError } = await db
    .from('teams')
    .insert({ name, description })
    .select()
    .single()
  
  if (teamError) throw teamError

  // 2. Add Creator as Owner
  const { error: memberError } = await db
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: ownerId,
      role: 'owner'
    })
  
  if (memberError) throw memberError

  // 3. Update Profile with group_id (compatibility)
  await updateProfileById(ownerId, { group_id: team.id })

  return team
}

export async function joinTeam(teamId: string, userId: string, role: string = 'member') {
  const db = createBrowserSupabaseClient()

  // 1. Check if user is educator
  const profile = await fetchProfileById(userId)
  const finalRole = profile?.is_educator ? 'viewer' : role

  // 2. Join Team
  const { error: memberError } = await db
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      role: finalRole
    })
  
  if (memberError) throw memberError

  // 3. Update Profile
  await updateProfileById(userId, { group_id: teamId })

  return { success: true }
}

export async function fetchUserTeams(userId: string) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('team_members')
    .select('team_id, role, teams(*)')
    .eq('user_id', userId)
  
  if (error) throw error
  return data
}
