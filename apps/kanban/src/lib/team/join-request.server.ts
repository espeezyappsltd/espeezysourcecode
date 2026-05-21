import type { SupabaseClient } from '@supabase/supabase-js'
import { formatJoinRequestChatContent } from '@/lib/team/membership-transfer'
import { canManageJoinRequests } from '@/lib/team/rbac'
import { friendlyJoinRequestError } from '@/lib/team/join-request-errors'
import { getAdminDb } from '@/lib/supabase/admin'

const INTRO_MAX = 500

export type PendingJoinRequestRow = {
  id: string
  intro_message_sent: boolean
  intro_message: string | null
}

export async function assertJoinRequestBackend(): Promise<
  { ok: true; db: SupabaseClient } | { ok: false; error: string }
> {
  try {
    return { ok: true, db: getAdminDb() }
  } catch (err: unknown) {
    return { ok: false, error: friendlyJoinRequestError(err) }
  }
}

export async function validateJoinTarget(
  db: SupabaseClient,
  groupId: string,
  uid: string,
): Promise<
  | { ok: true; capacity: number; memberCount: number; requesterName: string }
  | { ok: false; error: string }
> {
  const [{ data: me, error: meError }, { data: group, error: groupError }, { count: memberCount }] =
    await Promise.all([
      db.from('profiles').select('group_id, full_name').eq('id', uid).single(),
      db.from('groups').select('id, capacity, name').eq('id', groupId).maybeSingle(),
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId),
    ])

  if (meError) return { ok: false, error: friendlyJoinRequestError(meError) }
  if (groupError) return { ok: false, error: friendlyJoinRequestError(groupError) }
  if (!group) return { ok: false, error: 'This team could not be found.' }
  if (me?.group_id === groupId) {
    return { ok: false, error: 'You are already on this team.' }
  }

  const capacity = group.capacity ?? 5
  if ((memberCount ?? 0) >= capacity) {
    return {
      ok: false,
      error: `This team is full (${memberCount}/${capacity}). Ask the team lead to add capacity.`,
    }
  }

  return {
    ok: true,
    capacity,
    memberCount: memberCount ?? 0,
    requesterName: me?.full_name?.trim() || 'A student',
  }
}

/** Create or reuse a pending request row (handles declined → pending and duplicate races). */
export async function ensurePendingJoinRequest(
  db: SupabaseClient,
  groupId: string,
  uid: string,
  introMessage?: string | null,
): Promise<
  | { ok: true; request: PendingJoinRequestRow; created: boolean }
  | { ok: false; error: string }
> {
  const trimmedIntro = introMessage?.trim().slice(0, INTRO_MAX) || null

  const { data: existing, error: existingError } = await db
    .from('group_join_requests')
    .select('id, status, intro_message_sent, intro_message')
    .eq('group_id', groupId)
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) return { ok: false, error: friendlyJoinRequestError(existingError) }

  if (existing?.status === 'pending') {
    if (trimmedIntro && !existing.intro_message) {
      await db
        .from('group_join_requests')
        .update({ intro_message: trimmedIntro, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    }
    return {
      ok: true,
      created: false,
      request: {
        id: existing.id,
        intro_message_sent: existing.intro_message_sent,
        intro_message: trimmedIntro ?? existing.intro_message,
      },
    }
  }

  if (existing?.status === 'accepted') {
    return {
      ok: false,
      error: 'You were already accepted to this team. Open Settings → Workspace to switch back, or leave your current team first.',
    }
  }

  if (existing?.status === 'declined') {
    const { data: revived, error: reviveError } = await db
      .from('group_join_requests')
      .update({
        status: 'pending',
        intro_message: trimmedIntro ?? existing.intro_message,
        intro_message_sent: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, intro_message_sent, intro_message')
      .single()

    if (!reviveError && revived) {
      return { ok: true, created: false, request: revived }
    }
  }

  const { data: inserted, error: insertError } = await db
    .from('group_join_requests')
    .insert({
      group_id: groupId,
      user_id: uid,
      status: 'pending',
      intro_message: trimmedIntro,
      intro_message_sent: false,
    })
    .select('id, intro_message_sent, intro_message')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raced } = await db
        .from('group_join_requests')
        .select('id, intro_message_sent, intro_message')
        .eq('group_id', groupId)
        .eq('user_id', uid)
        .eq('status', 'pending')
        .maybeSingle()
      if (raced) return { ok: true, created: false, request: raced }
    }
    return { ok: false, error: friendlyJoinRequestError(insertError) }
  }

  return { ok: true, created: true, request: inserted }
}

export async function postJoinRequestIntroMessage(
  db: SupabaseClient,
  groupId: string,
  uid: string,
  senderName: string,
  request: PendingJoinRequestRow,
  introMessage?: string | null,
): Promise<{ sent: boolean; skipped: boolean }> {
  if (request.intro_message_sent) {
    return { sent: false, skipped: true }
  }

  const chatBody = formatJoinRequestChatContent(
    senderName,
    introMessage ?? request.intro_message,
  )

  const { error: messageError } = await db.from('messages').insert({
    group_id: groupId,
    user_id: uid,
    content: chatBody,
    payload: null,
    is_deleted: false,
  })

  if (messageError) {
    console.warn('[join-request] team chat intro failed:', messageError.message)
    return { sent: false, skipped: false }
  }

  await db
    .from('group_join_requests')
    .update({ intro_message_sent: true, updated_at: new Date().toISOString() })
    .eq('id', request.id)

  return { sent: true, skipped: false }
}

export async function notifyTeamLeadsOfJoinRequest(
  db: SupabaseClient,
  groupId: string,
  requesterId: string,
  requesterName: string,
): Promise<void> {
  const { data: leads, error } = await db
    .from('profiles')
    .select('id, role')
    .eq('group_id', groupId)

  if (error) {
    console.warn('[join-request] lead lookup failed:', error.message)
    return
  }

  const targets = (leads ?? []).filter(
    (p) => p.id !== requesterId && canManageJoinRequests(p.role as string),
  )
  if (targets.length === 0) return

  const title = 'New join request'
  const message = `${requesterName.trim() || 'A student'} wants to join your team.`
  const link = '/settings'

  const { error: notifyError } = await db.from('notifications').insert(
    targets.map((lead) => ({
      user_id: lead.id,
      type: 'join_request',
      title,
      message,
      link,
      read: false,
      metadata: { group_id: groupId, requester_id: requesterId },
    })),
  )

  if (notifyError) {
    console.warn('[join-request] notifications insert failed:', notifyError.message)
  }
}
