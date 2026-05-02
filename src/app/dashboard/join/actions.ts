'use server'

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Helper to get UID from session cookie
async function getUid() {
  const sessionCookie = (await cookies()).get('__session')?.value
  if (!sessionCookie) return null
  try {
    const adminAuth = getAdminAuth()
    if (!adminAuth) return null
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims.uid
  } catch (e) {
    return null
  }
}

export async function createGroup(formData: FormData) {
  const uid = await getUid()
  if (!uid) return redirect('/login')

  const adminDb = getAdminDb()
  if (!adminDb) return redirect('/dashboard/join?error=Service+Unavailable')

  const groupName = (formData.get('name') as string || '').trim()
  const moduleCode = (formData.get('module_code') as string || '').trim().toUpperCase()
  const joinPassword = (formData.get('join_password') as string || '').trim()
  const capacity = parseInt(formData.get('capacity') as string || '5', 10)

  try {
    // 1. Create the group
    const groupRef = await adminDb.collection('groups').add({ 
      name: groupName, 
      module_code: moduleCode, 
      join_password: joinPassword,
      capacity: capacity,
      created_at: new Date().toISOString()
    })

    // 2. Update the user's profile to join this group
    await adminDb.collection('profiles').doc(uid).update({ 
      group_id: groupRef.id,
      role: 'admin' 
    })

    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  } catch (err: any) {
    redirect('/dashboard/join?error=' + encodeURIComponent(err.message))
  }
}

export async function joinGroup(formData: FormData) {
  const uid = await getUid()
  if (!uid) return redirect('/login')

  const adminDb = getAdminDb()
  if (!adminDb) return redirect('/dashboard/join?error=Service+Unavailable')

  const moduleCode = (formData.get('module_code') as string || '').trim().toUpperCase()
  const joinPassword = (formData.get('join_password') as string || '').trim()

  try {
    // 1. Search for the group
    const groupQuery = await adminDb.collection('groups')
      .where('module_code', '==', moduleCode)
      .limit(1)
      .get()

    if (groupQuery.empty) {
      redirect('/dashboard/join?error=' + encodeURIComponent('Could not find a group with that Module Code.'))
    }

    const groupDoc = groupQuery.docs[0]
    const group = groupDoc.data()
    const groupId = groupDoc.id

    // 2. Verify capacity
    const membersSnap = await adminDb.collection('profiles')
      .where('group_id', '==', groupId)
      .get()

    if (membersSnap.size >= (group.capacity || 5)) {
      redirect('/dashboard/join?error=' + encodeURIComponent(`Transmission Blocked: This research team has reached its maximum capacity of ${group.capacity} scholars.`))
    }

    // 3. Verify password
    if (group.join_password && group.join_password !== joinPassword) {
      redirect('/dashboard/join?error=' + encodeURIComponent('Incorrect Join Password for this module.'))
    }

    // 4. Update the user's profile
    await adminDb.collection('profiles').doc(uid).update({ group_id: groupId })

    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  } catch (err: any) {
    redirect('/dashboard/join?error=' + encodeURIComponent(err.message))
  }
}

export async function kickUser(userId: string) {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  try {
    const adminDb = getAdminDb()
    if (!adminDb) return { error: 'Service Unavailable' }
    const adminProfileSnap = await adminDb.collection('profiles').doc(uid).get()
    const adminProfile = adminProfileSnap.data()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return { error: 'Unauthorized: Only admins can manage team members' }
    }

    const targetProfileSnap = await adminDb.collection('profiles').doc(userId).get()
    const targetProfile = targetProfileSnap.data()

    if (!targetProfile || targetProfile.group_id !== adminProfile.group_id) {
      return { error: 'Target user not found in your team' }
    }

    if (targetProfile.role === 'admin') {
      return { error: 'Cannot kick another administrator' }
    }

    await adminDb.collection('profiles').doc(userId).update({ 
      group_id: null,
      role: 'collaborator' 
    })

    revalidatePath('/dashboard/settings')
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
    if (!adminDb) throw new Error('Service Unavailable')
    await adminDb.collection('group_join_requests').doc(`${groupId}_${uid}`).set({
      group_id: groupId,
      user_id: uid,
      status: 'pending',
      created_at: new Date().toISOString()
    })

    // Notify in chat
    await adminDb.collection('messages').add({
      group_id: groupId,
      user_id: uid,
      content: `👋 [JOIN REQUEST] I'd like to join the team. I'm ${senderName}.`,
      is_system: true,
      created_at: new Date().toISOString()
    })

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
    if (!adminDb) return { error: 'Service Unavailable' }
    const requestSnap = await adminDb.collection('group_join_requests').doc(requestId).get()
    if (!requestSnap.exists) return { error: 'Request not found' }
    
    const request = requestSnap.data()!

    await adminDb.collection('profiles').doc(request.user_id).update({ 
      group_id: request.group_id 
    })

    await adminDb.collection('group_join_requests').doc(requestId).delete()

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function declineJoinRequest(requestId: string) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return { error: 'Service Unavailable' }
    await adminDb.collection('group_join_requests').doc(requestId).delete()
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
