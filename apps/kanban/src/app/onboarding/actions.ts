'use server'

import { getAdminDb } from '@/lib/supabase/admin'
import { getUid } from '@/utils/auth-server'
import { revalidatePath } from 'next/cache'

async function ensureProfileRow(uid: string, email?: string | null) {
  const adminDb = getAdminDb()
  const { data: existing } = await adminDb
    .from('profiles')
    .select('id')
    .eq('id', uid)
    .maybeSingle()

  if (existing) return

  const { error } = await adminDb.from('profiles').insert({
    id: uid,
    email: email ?? null,
    role: 'member',
  })

  if (error) throw error
}

export async function createWorkspaceTeam(name: string, description: string) {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  const trimmedName = name.trim()
  if (!trimmedName) return { error: 'Team name is required' }

  try {
    const adminDb = getAdminDb()
    await ensureProfileRow(uid)

    const { data: group, error: groupError } = await adminDb
      .from('groups')
      .insert({
        name: trimmedName,
        description: description.trim() || null,
        owner_id: uid,
      })
      .select('id')
      .single()

    if (groupError || !group?.id) {
      throw groupError ?? new Error('Failed to create team')
    }

    const { error: profileError } = await adminDb
      .from('profiles')
      .update({ group_id: group.id, role: 'admin' })
      .eq('id', uid)

    if (profileError) throw profileError

    revalidatePath('/', 'layout')
    return { success: true, teamId: group.id }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to create team' }
  }
}

export async function joinWorkspaceTeam(teamId: string) {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  const trimmedId = teamId.trim()
  if (!trimmedId) return { error: 'Team ID is required' }

  try {
    const adminDb = getAdminDb()
    await ensureProfileRow(uid)

    const { data: group, error: groupError } = await adminDb
      .from('groups')
      .select('id, capacity')
      .eq('id', trimmedId)
      .maybeSingle()

    if (groupError) throw groupError
    if (!group) return { error: 'Team not found. Check the Team ID.' }

    const { count: memberCount, error: memberError } = await adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id)

    if (memberError) throw memberError

    if ((memberCount ?? 0) >= (group.capacity || 5)) {
      return { error: `This team has reached its maximum capacity of ${group.capacity || 5} members.` }
    }

    const { error: profileError } = await adminDb
      .from('profiles')
      .update({ group_id: group.id })
      .eq('id', uid)

    if (profileError) throw profileError

    revalidatePath('/', 'layout')
    return { success: true, teamId: group.id }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to join team' }
  }
}
