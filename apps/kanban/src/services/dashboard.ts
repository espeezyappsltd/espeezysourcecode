import { createBrowserSupabaseClient } from '@/lib/db-client'
import { isMissingColumnError } from '@/utils/supabase-errors'
import { PRESENCE_ONLINE_WINDOW_MS } from '@/lib/presence/team-presence'
import { Q } from '@/lib/query-columns'
import type { Group, Profile, Task, Artifact, Commit, ActivityLog, ActivityLogRow } from '@/types/database'
import type { Profile as AuthProfile } from '@/types/auth'

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

export async function fetchProfileById(userId: string): Promise<AuthProfile | null> {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('profiles')
    .select(Q.profile.detail)
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data as AuthProfile | null
}

export async function updateProfileById(userId: string, updates: Record<string, unknown>) {
  const db = createBrowserSupabaseClient()
  const { error } = await db.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

export async function fetchGroupById(groupId: string) {
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

const TASK_BOARD_SELECT =
  'id, title, description, status, category, assignees, group_id, is_coding_task, due_date, created_at, board_visible'

export async function fetchGroupTasks(groupId: string) {
  const db = createBrowserSupabaseClient()
  const withVisibility = await db
    .from('tasks')
    .select(TASK_BOARD_SELECT)
    .eq('group_id', groupId)
    .or('board_visible.is.null,board_visible.eq.true')

  if (!withVisibility.error) {
    return (withVisibility.data ?? []) as Task[]
  }

  const fallback = await db
    .from('tasks')
    .select('id, title, description, status, category, assignees, group_id, is_coding_task, due_date, created_at')
    .eq('group_id', groupId)
  if (fallback.error) throw fallback.error
  return (fallback.data ?? []) as Task[]
}

/** Tasks assigned to a user across teams (includes archived / off-board). */
export async function fetchMemberTasksForProfile(userId: string, limit = 50) {
  const db = createBrowserSupabaseClient()
  const { data, error } = await db
    .from('tasks')
    .select('id, title, status, group_id, assignees, board_visible, created_at, due_date')
    .contains('assignees', [userId])
    .order('updated_at', { ascending: false })
    .limit(limit)
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

type ActivityLogDbRow = ActivityLog & {
  profiles?: { full_name: string | null } | null
}

function formatActivityLogDescription(details: Record<string, unknown> | null | undefined, action: string): string {
  if (!details) return action
  if (typeof details.message === 'string' && details.message.trim()) return details.message
  if (typeof details.description === 'string' && details.description.trim()) return details.description
  try {
    const compact = JSON.stringify(details)
    return compact.length > 200 ? `${compact.slice(0, 197)}…` : compact
  } catch {
    return action
  }
}

export function mapActivityLogRow(row: ActivityLogDbRow): ActivityLogRow {
  const details = (row.details ?? {}) as Record<string, unknown>
  return {
    ...row,
    action_type: row.action,
    user_name: row.profiles?.full_name ?? 'System',
    description: formatActivityLogDescription(details, row.action),
    message: typeof details.message === 'string' ? details.message : undefined,
    impact_score: typeof details.impact_score === 'number' ? details.impact_score : 0,
  }
}

const ACTIVITY_LOG_COLUMNS = [
  'id, user_id, group_id, action, details, created_at',
  'id, user_id, group_id, action, details, created_at, status',
] as const

type ActivityLogQueryResult = {
  data: unknown[] | null
  error: { message?: string } | null
}

/** PostgREST has no FK from activity_logs → profiles; never use profiles(...) embed. */
async function selectActivityLogs(
  run: (
    db: ReturnType<typeof createBrowserSupabaseClient>,
    columns: string,
  ) => PromiseLike<ActivityLogQueryResult>,
): Promise<ActivityLog[]> {
  let lastError: { message?: string } | null = null
  const db = createBrowserSupabaseClient()

  for (const columns of ACTIVITY_LOG_COLUMNS) {
    const { data, error } = await run(db, columns)
    if (!error) return (data ?? []) as ActivityLog[]
    lastError = error
    if (!isMissingColumnError(error.message)) break
  }

  if (lastError) throw lastError
  return []
}

/** PostgREST has no FK from activity_logs → profiles; resolve names in a second query. */
async function enrichActivityLogsWithProfiles(
  rows: ActivityLog[],
): Promise<ActivityLogDbRow[]> {
  if (rows.length === 0) return []

  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[]
  const profileById: Record<string, { full_name: string | null; avatar_url: string | null }> =
    {}

  if (userIds.length > 0) {
    const db = createBrowserSupabaseClient()
    const { data: profiles, error } = await db
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    if (error) {
      console.warn('[activity_logs] profile lookup failed:', error.message)
    } else {
      for (const p of profiles ?? []) {
        profileById[p.id as string] = {
          full_name: (p.full_name as string | null) ?? null,
          avatar_url: (p.avatar_url as string | null) ?? null,
        }
      }
    }
  }

  return rows.map((row) => ({
    ...row,
    profiles: row.user_id ? (profileById[row.user_id] ?? null) : null,
  }))
}

export async function fetchActivityLogByGroup(
  groupId: string,
  rowLimit = 500,
): Promise<ActivityLogRow[]> {
  try {
    const rows = await selectActivityLogs(async (db, columns) => {
      const result = await db
        .from('activity_logs')
        .select(columns)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(rowLimit)
      return result
    })
    const enriched = await enrichActivityLogsWithProfiles(rows)
    return enriched.map(mapActivityLogRow)
  } catch (err) {
    console.warn('[fetchActivityLogByGroup]', err)
    return []
  }
}

/** Personal + team activity (marketplace, credits, tasks, etc.) */
export async function fetchActivityFeed(opts: {
  userId?: string
  groupId?: string | null
  limit?: number
}): Promise<ActivityLogRow[]> {
  const limit = opts.limit ?? 200
  if (!opts.userId && !opts.groupId) return []

  try {
    const rows = await selectActivityLogs(async (db, columns) => {
      let q = db.from('activity_logs').select(columns).order('created_at', { ascending: false }).limit(limit)
      if (opts.userId && opts.groupId) {
        q = q.or(`user_id.eq.${opts.userId},group_id.eq.${opts.groupId}`)
      } else if (opts.userId) {
        q = q.eq('user_id', opts.userId)
      } else if (opts.groupId) {
        q = q.eq('group_id', opts.groupId)
      }
      return await q
    })
    const enriched = await enrichActivityLogsWithProfiles(rows)
    return enriched.map(mapActivityLogRow)
  } catch (err) {
    console.warn('[fetchActivityFeed]', err)
    return []
  }
}

export type MarketplaceTxRow = {
  date: string
  role: 'buyer' | 'seller'
  listingTitle: string
  credits: number
  userName: string
  status: string
}

export async function fetchTeamMarketplaceTransactions(
  members: Pick<Profile, 'id' | 'full_name'>[],
): Promise<MarketplaceTxRow[]> {
  const db = createBrowserSupabaseClient()
  const ids = members.map((m) => m.id).filter(Boolean)
  if (ids.length === 0) return []

  const nameById = Object.fromEntries(
    members.map((m) => [m.id, m.full_name ?? 'Unknown']),
  ) as Record<string, string>

  const select =
    'id, listing_title, credits_amount, created_at, buyer_id, seller_id, status'

  const [asBuyer, asSeller] = await Promise.all([
    db
      .from('marketplace_purchases')
      .select(select)
      .in('buyer_id', ids)
      .order('created_at', { ascending: false })
      .limit(150),
    db
      .from('marketplace_purchases')
      .select(select)
      .in('seller_id', ids)
      .order('created_at', { ascending: false })
      .limit(150),
  ])

  const seen = new Set<string>()
  const rows: MarketplaceTxRow[] = []

  const push = (
    p: {
      id: string
      listing_title: string
      credits_amount: number
      created_at: string
      buyer_id: string
      seller_id: string
      status?: string | null
    },
    role: 'buyer' | 'seller',
  ) => {
    if (seen.has(p.id)) return
    seen.add(p.id)
    const userId = role === 'buyer' ? p.buyer_id : p.seller_id
    rows.push({
      date: p.created_at,
      role,
      listingTitle: p.listing_title,
      credits: p.credits_amount,
      userName: nameById[userId] ?? 'Unknown',
      status: p.status ?? 'completed',
    })
  }

  ;(asBuyer.data ?? []).forEach((p) => push(p, 'buyer'))
  ;(asSeller.data ?? []).forEach((p) => push(p, 'seller'))

  return rows.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export async function fetchGlobalOnlineUserIds(): Promise<string[]> {
  const db = createBrowserSupabaseClient()
  const staleCutoff = new Date(Date.now() - PRESENCE_ONLINE_WINDOW_MS).toISOString()
  const { data, error } = await db
    .from('presence')
    .select('user_id')
    .eq('is_online', true)
    .gte('last_seen', staleCutoff)
  if (error) throw error
  return Array.from(new Set((data ?? []).map((r) => r.user_id as string).filter(Boolean)))
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

/** @deprecated Use createWorkspaceTeam server action from @/app/onboarding/actions */
export async function createTeam(name: string, description: string, ownerId: string) {
  const db = createBrowserSupabaseClient()

  const { data: group, error: groupError } = await db
    .from('groups')
    .insert({ name, description, owner_id: ownerId })
    .select('id')
    .single()

  if (groupError) throw groupError
  if (!group?.id) throw new Error('Failed to create team')

  await updateProfileById(ownerId, { group_id: group.id, role: 'admin' })
  return group
}

/** @deprecated Use joinWorkspaceTeam server action from @/app/onboarding/actions */
export async function joinTeam(teamId: string, userId: string) {
  await updateProfileById(userId, { group_id: teamId })
  return { success: true }
}

export async function fetchUserTeams(userId: string) {
  const db = createBrowserSupabaseClient()
  const { data: profile, error } = await db
    .from('profiles')
    .select('group_id, role, groups(*)')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!profile?.group_id) return []
  return [{ team_id: profile.group_id, role: profile.role, teams: profile.groups }]
}
