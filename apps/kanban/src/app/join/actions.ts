'use server'

import { getAdminDb } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUid } from '@/utils/auth-server'

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
  } catch (err: any) {
    redirect('/join?error=' + encodeURIComponent(err.message))
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

    const { error: profileError } = await adminDb
      .from('profiles')
      .update({ group_id: group.id })
      .eq('id', uid)

    if (profileError) {
      throw profileError
    }

    revalidatePath('/', 'layout')
    redirect('/')
  } catch (err: any) {
    redirect('/join?error=' + encodeURIComponent(err.message))
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

    const { error: updateError } = await adminDb
      .from('profiles')
      .update({
        group_id: null,
        role: 'collaborator',
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    revalidatePath('//settings')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function sendJoinRequest(groupId: string, senderName: string) {
  const uid = await getUid()
  if (!uid) throw new Error('Not authenticated')

  try {
    const adminDb = getAdminDb()
    const { data: existingRequest, error: existingError } = await adminDb
      .from('group_join_requests')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', uid)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (!existingRequest) {
      const { error: requestError } = await adminDb
        .from('group_join_requests')
        .insert({
          group_id: groupId,
          user_id: uid,
          status: 'pending',
        })

      if (requestError) {
        throw requestError
      }
    }

    const { error: messageError } = await adminDb
      .from('messages')
      .insert({
        group_id: groupId,
        user_id: uid,
        content: `👋 [JOIN REQUEST] I'd like to join the team. I'm ${senderName}.`,
        is_system: true,
      })

    if (messageError) {
      throw messageError
    }

    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}

export async function acceptJoinRequest(requestId: string) {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  try {
    const adminDb = getAdminDb()
    const { data: request, error: requestError } = await adminDb
      .from('group_join_requests')
      .select('group_id, user_id')
      .eq('id', requestId)
      .single()

    if (requestError || !request) return { error: 'Request not found' }

    const { error: profileError } = await adminDb
      .from('profiles')
      .update({ group_id: request.group_id })
      .eq('id', request.user_id)

    if (profileError) {
      throw profileError
    }

    const { error: deleteError } = await adminDb
      .from('group_join_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      throw deleteError
    }

    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function declineJoinRequest(requestId: string) {
  try {
    const adminDb = getAdminDb()
    const { error } = await adminDb
      .from('group_join_requests')
      .delete()
      .eq('id', requestId)

    if (error) {
      throw error
    }

    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
