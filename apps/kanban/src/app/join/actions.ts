'use server'

import { getAdminDb } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUid } from '@/utils/auth-server'
import { formatJoinRequestChatContent } from '@/lib/team/membership-transfer'
import {
  archiveMemberTasksForGroup,
  restoreMemberTasksOnGroupBoard,
} from '@/lib/team/membership-transfer.server'

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

    if (!adminProfile || adminProfile.role !== 'admin') {
      return { error: 'Unauthorized: Only admins can manage team members' }
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

    if (targetProfile.role === 'admin') {
      return { error: 'Cannot kick another administrator' }
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
  | { success: true; alreadySent?: boolean }
  | { success: false; error: string }

export async function sendJoinRequest(
  groupId: string,
  senderName: string,
  introMessage?: string | null,
): Promise<SendJoinRequestResult> {
  const uid = await getUid()
  if (!uid) return { success: false, error: 'Not authenticated' }

  try {
    const adminDb = getAdminDb()

    const { data: me, error: meError } = await adminDb
      .from('profiles')
      .select('group_id')
      .eq('id', uid)
      .single()

    if (meError) throw meError
    if (me?.group_id === groupId) {
      return { success: false, error: 'You are already on this team.' }
    }

    const { count: memberCount } = await adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)

    const { data: targetGroup } = await adminDb
      .from('groups')
      .select('capacity')
      .eq('id', groupId)
      .maybeSingle()

    if ((memberCount ?? 0) >= (targetGroup?.capacity ?? 5)) {
      return { success: false, error: 'This team is at capacity.' }
    }

    const { data: existingRequest, error: existingError } = await adminDb
      .from('group_join_requests')
      .select('id, intro_message_sent, intro_message')
      .eq('group_id', groupId)
      .eq('user_id', uid)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()

    if (existingError) throw existingError

    let requestId = existingRequest?.id

    if (!existingRequest) {
      const trimmedIntro = introMessage?.trim() || null
      const { data: inserted, error: requestError } = await adminDb
        .from('group_join_requests')
        .insert({
          group_id: groupId,
          user_id: uid,
          status: 'pending',
          intro_message: trimmedIntro,
          intro_message_sent: false,
        })
        .select('id')
        .single()

      if (requestError) throw requestError
      requestId = inserted.id
    } else if (introMessage?.trim() && !existingRequest.intro_message) {
      await adminDb
        .from('group_join_requests')
        .update({ intro_message: introMessage.trim().slice(0, 500) })
        .eq('id', existingRequest.id)
    }

    if (existingRequest?.intro_message_sent) {
      return { success: true, alreadySent: true }
    }

    const chatBody = formatJoinRequestChatContent(
      senderName,
      introMessage ?? existingRequest?.intro_message,
    )

    const { error: messageError } = await adminDb.from('messages').insert({
      group_id: groupId,
      user_id: uid,
      content: chatBody,
      is_deleted: false,
    })

    if (messageError) throw messageError

    if (requestId) {
      await adminDb
        .from('group_join_requests')
        .update({ intro_message_sent: true, updated_at: new Date().toISOString() })
        .eq('id', requestId)
    }

    revalidatePath('/settings')
    revalidatePath(`/analytics/${groupId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not send join request'
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

  const role = adminProfile?.role?.toLowerCase()
  const isAdmin =
    adminProfile?.group_id === groupId && (role === 'admin' || role === 'team_leader')

  if (!isAdmin) {
    return { ok: false as const, error: 'Only team leaders can manage join requests.' }
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
    return { error: err instanceof Error ? err.message : 'unknown error' }
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
    return { error: err instanceof Error ? err.message : 'unknown error' }
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
    .in('status', ['pending', 'accepted'])

  if (error) {
    console.warn('[fetchSentJoinRequestGroupIds]', error.message)
    return []
  }

  return Array.from(new Set((data ?? []).map((r) => r.group_id)))
}
