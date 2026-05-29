'use server'

import { getAdminDb } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUid } from '@/utils/auth-server'
import {
  archiveMemberTasksForGroup,
  restoreMemberTasksOnGroupBoard,
} from '@/lib/team/membership-transfer.server'
import { friendlyJoinRequestError } from '@/lib/team/join-request-errors'
import {
  assertJoinRequestBackend,
  ensurePendingJoinRequest,
  notifyTeamLeadsOfJoinRequest,
  postJoinRequestIntroMessage,
  validateJoinTarget,
} from '@/lib/team/join-request.server'
import { canKickTarget, canManageJoinRequests } from '@/lib/team/rbac'

export async function createGroup(formData: FormData) {
  const uid = await getUid()
  if (!uid) return redirect('/login')

  const adminDb = getAdminDb()

  const groupName = (formData.get('name') as string || '').trim()
  const moduleCode = (formData.get('module_code') as string || '').trim().toUpperCase()
  const joinPassword = (formData.get('join_password') as string || '').trim()
  const capacity = parseInt(formData.get('capacity') as string || '5', 10)

  try {
    const { data: group, error: groupError } = await adminDb
      .from('groups')
      .insert({
        name: groupName,
        module_code: moduleCode,
        join_password: joinPassword,
        capacity,
      })
      .select('id')
      .single()

    if (groupError || !group) {
      throw groupError ?? new Error('Failed to create group')
    }

    const { error: profileError } = await adminDb
      .from('profiles')
      .update({
        group_id: group.id,
        role: 'admin',
      })
      .eq('id', uid)

    if (profileError) {
      throw profileError
    }

    revalidatePath('/', 'layout')
    redirect('/')
  } catch (err: unknown) {
    redirect('/join?error=' + encodeURIComponent(err instanceof Error ? err.message : 'unknown error'))
  }
}

export async function joinGroup(formData: FormData) {
  const uid = await getUid()
  if (!uid) return redirect('/login')

  const adminDb = getAdminDb()

  const moduleCode = (formData.get('module_code') as string || '').trim().toUpperCase()
  const joinPassword = (formData.get('join_password') as string || '').trim()

  try {
    const { data: group, error: groupError } = await adminDb
      .from('groups')
      .select('id, capacity, join_password')
      .eq('module_code', moduleCode)
      .limit(1)
      .maybeSingle()

    if (groupError) {
      throw groupError
    }

    if (!group) {
      redirect('/join?error=' + encodeURIComponent('Could not find a group with that Module Code.'))
    }

    const { count: memberCount, error: memberError } = await adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id)

    if (memberError) {
      throw memberError
    }

    if ((memberCount ?? 0) >= (group.capacity || 5)) {
      redirect('/join?error=' + encodeURIComponent(`Transmission Blocked: This research team has reached its maximum capacity of ${group.capacity} scholars.`))
    }

    if (group.join_password && group.join_password !== joinPassword) {
      redirect('/join?error=' + encodeURIComponent('Incorrect Join Password for this module.'))
    }

    const { data: profile } = await adminDb.from('profiles').select('group_id, archived_group_id').eq('id', uid).single()
    const previousGroupId = profile?.group_id ?? null

    if (previousGroupId && previousGroupId !== group.id) {
      await archiveMemberTasksForGroup(uid, previousGroupId)
    }

    if (profile?.archived_group_id === group.id) {
      await restoreMemberTasksOnGroupBoard(uid, group.id)
    }

    const { error: profileError } = await adminDb
      .from('profiles')
      .update({
        group_id: group.id,
        archived_group_id: previousGroupId && previousGroupId !== group.id ? previousGroupId : profile?.archived_group_id ?? null,
        role: 'collaborator',
      })
      .eq('id', uid)

    if (profileError) {
      throw profileError
    }

    revalidatePath('/', 'layout')
    redirect('/')
  } catch (err: unknown) {
    redirect('/join?error=' + encodeURIComponent(err instanceof Error ? err.message : 'unknown error'))
  }
}

export async function kickUser(userId: string) {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  try {
    const adminDb = getAdminDb()
    const { data: adminProfile, error: adminProfileError } = await adminDb
      .from('profiles')
      .select('group_id, role')
      .eq('id', uid)
      .single()

    if (adminProfileError) {
      throw adminProfileError
    }

    if (!adminProfile?.group_id || !canManageJoinRequests(adminProfile.role)) {
      return { error: 'Only team leads can remove members.' }
    }

    const { data: targetProfile, error: targetProfileError } = await adminDb
      .from('profiles')
      .select('group_id, role')
      .eq('id', userId)
      .single()

    if (targetProfileError) {
      throw targetProfileError
    }

    if (!targetProfile || targetProfile.group_id !== adminProfile.group_id) {
      return { error: 'Target user not found in your team' }
    }

    if (!canKickTarget(adminProfile.role, targetProfile.role)) {
      return { error: 'You cannot remove this member.' }
    }

    const leavingGroupId = targetProfile.group_id

    if (leavingGroupId) {
      await archiveMemberTasksForGroup(userId, leavingGroupId)
    }

    const { error: updateError } = await adminDb
      .from('profiles')
      .update({
        group_id: null,
        archived_group_id: leavingGroupId,
        role: 'collaborator',
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }
}

export type SendJoinRequestResult =
  | {
      success: true
      alreadyPending?: boolean
      chatSkipped?: boolean
      chatPosted?: boolean
      notifiedLeads?: boolean
    }
  | { success: false; error: string }

export type TeamJoinPreview = {
  memberCount: number
  capacity: number
  hasPendingRequest: boolean
}

export type TeamGroupMetric = {
  groupId: string
  memberCount: number
  hasPendingRequest: boolean
  isOwner: boolean
  canDelete: boolean
}

/** Public team stats for join / analytics preview (service role). */
export async function fetchTeamJoinPreview(groupId: string): Promise<TeamJoinPreview> {
  const uid = await getUid()
  const fallback: TeamJoinPreview = { memberCount: 0, capacity: 5, hasPendingRequest: false }

  if (!uid) return fallback

  try {
    const adminDb = getAdminDb()

    const [{ count: memberCount }, { data: group }, { data: pending }] = await Promise.all([
      adminDb
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId),
      adminDb.from('groups').select('capacity').eq('id', groupId).maybeSingle(),
      adminDb
        .from('group_join_requests')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', uid)
        .eq('status', 'pending')
        .maybeSingle(),
    ])

    return {
      memberCount: memberCount ?? 0,
      capacity: group?.capacity ?? 5,
      hasPendingRequest: Boolean(pending),
    }
  } catch (err) {
    console.warn('[fetchTeamJoinPreview]', err)
    return fallback
  }
}

export async function sendJoinRequest(
  groupId: string,
  senderName: string,
  introMessage?: string | null,
): Promise<SendJoinRequestResult> {
  const uid = await getUid()
  if (!uid) return { success: false, error: 'Sign in to request a team.' }

  const backend = await assertJoinRequestBackend()
  if (!backend.ok) return { success: false, error: backend.error }

  const db = backend.db

  try {
    const target = await validateJoinTarget(db, groupId, uid)
    if (!target.ok) return { success: false, error: target.error }

    const pending = await ensurePendingJoinRequest(db, groupId, uid, introMessage)
    if (!pending.ok) return { success: false, error: pending.error }

    const displayName = senderName.trim() || target.requesterName
    await notifyTeamLeadsOfJoinRequest(db, groupId, uid, displayName)

    const chat = await postJoinRequestIntroMessage(
      db,
      groupId,
      uid,
      displayName,
      pending.request,
      introMessage,
    )

    revalidatePath('/settings')
    revalidatePath(`/analytics/${groupId}`)

    return {
      success: true,
      alreadyPending: !pending.created && pending.request.intro_message_sent,
      chatPosted: chat.sent,
      chatSkipped: !chat.sent && !chat.skipped,
      notifiedLeads: true,
    }
  } catch (err: unknown) {
    const message = friendlyJoinRequestError(err)
    console.error('[sendJoinRequest]', message, err)
    return { success: false, error: message }
  }
}

async function assertTeamAdmin(adminDb: ReturnType<typeof getAdminDb>, uid: string, groupId: string) {
  const { data: adminProfile } = await adminDb
    .from('profiles')
    .select('group_id, role')
    .eq('id', uid)
    .single()

  if (!adminProfile?.group_id || adminProfile.group_id !== groupId || !canManageJoinRequests(adminProfile.role)) {
    return { ok: false as const, error: 'Only team leads can manage join requests.' }
  }
  return { ok: true as const }
}

export async function acceptJoinRequest(requestId: string) {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  try {
    const adminDb = getAdminDb()
    const { data: request, error: requestError } = await adminDb
      .from('group_join_requests')
      .select('id, group_id, user_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !request) return { error: 'Request not found' }
    if (request.status !== 'pending') return { error: 'Request is no longer pending' }

    const auth = await assertTeamAdmin(adminDb, uid, request.group_id)
    if (!auth.ok) return { error: auth.error }

    const { data: joiner, error: joinerError } = await adminDb
      .from('profiles')
      .select('group_id, archived_group_id, full_name')
      .eq('id', request.user_id)
      .single()

    if (joinerError || !joiner) return { error: 'Member profile not found' }

    const previousGroupId = joiner.group_id

    if (previousGroupId && previousGroupId !== request.group_id) {
      await archiveMemberTasksForGroup(request.user_id, previousGroupId)
    }

    if (joiner.archived_group_id === request.group_id) {
      await restoreMemberTasksOnGroupBoard(request.user_id, request.group_id)
    }

    const { error: profileError } = await adminDb
      .from('profiles')
      .update({
        group_id: request.group_id,
        archived_group_id:
          previousGroupId && previousGroupId !== request.group_id ? previousGroupId : joiner.archived_group_id,
        role: 'collaborator',
      })
      .eq('id', request.user_id)

    if (profileError) throw profileError

    await adminDb
      .from('group_join_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    await adminDb
      .from('group_join_requests')
      .delete()
      .eq('user_id', request.user_id)
      .eq('status', 'pending')
      .neq('id', requestId)

    const joinerName = joiner.full_name?.split(' ')[0] ?? 'A teammate'
    await adminDb.from('messages').insert({
      group_id: request.group_id,
      user_id: request.user_id,
      content: `✅ ${joinerName} has joined the team.`,
      is_deleted: false,
    })

    revalidatePath('/')
    revalidatePath('/settings')
    return { success: true }
  } catch (err: unknown) {
    return { error: friendlyJoinRequestError(err, 'Could not accept join request') }
  }
}

export async function declineJoinRequest(requestId: string) {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  try {
    const adminDb = getAdminDb()
    const { data: request } = await adminDb
      .from('group_join_requests')
      .select('group_id')
      .eq('id', requestId)
      .single()

    if (!request) return { error: 'Request not found' }

    const auth = await assertTeamAdmin(adminDb, uid, request.group_id)
    if (!auth.ok) return { error: auth.error }

    const { error } = await adminDb
      .from('group_join_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) throw error

    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    return { error: friendlyJoinRequestError(err, 'Could not decline join request') }
  }
}

export async function switchTeamGroup(newGroupId: string | null): Promise<{ success?: boolean; error?: string }> {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  try {
    const adminDb = getAdminDb()
    const { data: profile, error: profileError } = await adminDb
      .from('profiles')
      .select('group_id, archived_group_id')
      .eq('id', uid)
      .single()

    if (profileError || !profile) return { error: 'Profile not found' }

    const previousGroupId = profile.group_id as string | null

    if (previousGroupId && previousGroupId !== newGroupId) {
      await archiveMemberTasksForGroup(uid, previousGroupId)
      if (newGroupId && profile.archived_group_id === newGroupId) {
        await restoreMemberTasksOnGroupBoard(uid, newGroupId)
      }
    }

    const { error: updateError } = await adminDb
      .from('profiles')
      .update({
        group_id: newGroupId,
        role: 'collaborator',
        archived_group_id:
          newGroupId && previousGroupId && previousGroupId !== newGroupId
            ? previousGroupId
            : newGroupId
              ? null
              : previousGroupId,
      })
      .eq('id', uid)

    if (updateError) throw updateError

    revalidatePath('/', 'layout')
    revalidatePath('/settings')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }
}

export async function fetchSentJoinRequestGroupIds(): Promise<string[]> {
  const uid = await getUid()
  if (!uid) return []

  const adminDb = getAdminDb()
  const { data, error } = await adminDb
    .from('group_join_requests')
    .select('group_id')
    .eq('user_id', uid)
    .eq('status', 'pending')

  if (error) {
    console.warn('[fetchSentJoinRequestGroupIds]', error.message)
    return []
  }

  return Array.from(new Set((data ?? []).map((r) => r.group_id)))
}

export async function fetchTeamGroupMetrics(groupIds: string[]): Promise<TeamGroupMetric[]> {
  const uid = await getUid()
  if (!uid) return []

  const uniqueGroupIds = Array.from(
    new Set(groupIds.map((id) => id.trim()).filter(Boolean)),
  )
  if (uniqueGroupIds.length === 0) return []

  const adminDb = getAdminDb()

  try {
    const [{ data: groups, error: groupsError }, { data: memberships, error: membershipsError }, { data: pendingRows, error: pendingError }] =
      await Promise.all([
        adminDb
          .from('groups')
          .select('id, owner_id')
          .in('id', uniqueGroupIds),
        adminDb
          .from('profiles')
          .select('group_id')
          .in('group_id', uniqueGroupIds),
        adminDb
          .from('group_join_requests')
          .select('group_id')
          .eq('user_id', uid)
          .eq('status', 'pending')
          .in('group_id', uniqueGroupIds),
      ])

    if (groupsError) throw groupsError
    if (membershipsError) throw membershipsError
    if (pendingError) throw pendingError

    const memberCountByGroup = new Map<string, number>()
    for (const row of memberships ?? []) {
      const groupId = row.group_id
      if (!groupId) continue
      memberCountByGroup.set(groupId, (memberCountByGroup.get(groupId) ?? 0) + 1)
    }

    const pendingSet = new Set((pendingRows ?? []).map((row) => row.group_id).filter(Boolean))

    return (groups ?? []).map((group) => {
      const memberCount = memberCountByGroup.get(group.id) ?? 0
      const isOwner = group.owner_id === uid
      return {
        groupId: group.id,
        memberCount,
        hasPendingRequest: pendingSet.has(group.id),
        isOwner,
        canDelete: isOwner && memberCount === 0,
      }
    })
  } catch (err) {
    console.warn('[fetchTeamGroupMetrics]', err)
    return []
  }
}

export async function deleteOwnedEmptyGroup(groupId: string): Promise<{ success?: true; error?: string }> {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  const groupIdTrimmed = groupId.trim()
  if (!groupIdTrimmed) return { error: 'Missing group id' }

  try {
    const adminDb = getAdminDb()
    const { data: group, error: groupError } = await adminDb
      .from('groups')
      .select('id, owner_id, name')
      .eq('id', groupIdTrimmed)
      .maybeSingle()

    if (groupError) throw groupError
    if (!group) return { error: 'Team not found.' }
    if (group.owner_id !== uid) {
      return { error: 'Only the team owner can delete this team.' }
    }

    const { count, error: countError } = await adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupIdTrimmed)

    if (countError) throw countError
    if ((count ?? 0) > 0) {
      return { error: 'This team still has members. Remove everyone first.' }
    }

    const { error: deleteError } = await adminDb.from('groups').delete().eq('id', groupIdTrimmed)
    if (deleteError) throw deleteError

    revalidatePath('/settings')
    revalidatePath('/join')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Could not delete team.' }
  }
}

export type UpdateOwnedGroupInput = {
  groupId: string
  name: string
  description: string | null
  capacity: number
  isEncrypted: boolean
}

export async function updateOwnedGroup(input: UpdateOwnedGroupInput): Promise<{ success?: true; error?: string }> {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  const groupId = input.groupId.trim()
  const name = input.name.trim()
  const description = input.description?.trim() ?? ''
  const capacity = Number(input.capacity)

  if (!groupId) return { error: 'Missing group id' }
  if (!name) return { error: 'Team name is required.' }
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 500) {
    return { error: 'Capacity must be between 1 and 500.' }
  }

  try {
    const adminDb = getAdminDb()
    const { data: group, error: groupError } = await adminDb
      .from('groups')
      .select('id, owner_id')
      .eq('id', groupId)
      .maybeSingle()

    if (groupError) throw groupError
    if (!group) return { error: 'Team not found.' }
    if (group.owner_id !== uid) {
      return { error: 'Only the team owner can edit this team.' }
    }

    const { count: memberCount, error: countError } = await adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
    if (countError) throw countError

    if ((memberCount ?? 0) > capacity) {
      return { error: `Capacity cannot be lower than current members (${memberCount ?? 0}).` }
    }

    const { error: updateError } = await adminDb
      .from('groups')
      .update({
        name,
        description: description.length > 0 ? description : null,
        capacity,
        is_encrypted: input.isEncrypted,
      })
      .eq('id', groupId)
    if (updateError) throw updateError

    revalidatePath('/settings')
    revalidatePath('/join')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Could not update team.' }
  }
}
