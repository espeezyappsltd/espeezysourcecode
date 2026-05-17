'use server'

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getUid } from '@/utils/auth-server'
import { revalidatePath } from 'next/cache'

function formatActionError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; code?: string; hint?: string }
    if (e.message?.includes('Invalid API key')) {
      return 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY in .env.local is invalid. Team setup uses your signed-in session instead — apply the latest database migration if this persists.'
    }
    if (e.code === '42501') {
      return 'Permission denied. Run `npx supabase db push` from the repo root to apply onboarding permissions.'
    }
    if (e.message) return e.message
  }
  return fallback
}

function generateModuleCode(name: string): string {
  const base = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X')
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return (base + suffix).slice(0, 8)
}

async function getOnboardingDb() {
  return createServerSupabaseClient()
}

async function ensureProfileRow(uid: string) {
  const db = await getOnboardingDb()
  const { data: existing } = await db.from('profiles').select('id').eq('id', uid).maybeSingle()
  if (existing) return

  const {
    data: { user },
  } = await db.auth.getUser()

  const { error } = await db.from('profiles').insert({
    id: uid,
    email: user?.email ?? null,
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
    const db = await getOnboardingDb()
    await ensureProfileRow(uid)

    const { data: group, error: groupError } = await db
      .from('groups')
      .insert({
        name: trimmedName,
        description: description.trim() || null,
        owner_id: uid,
        module_code: generateModuleCode(trimmedName),
        capacity: 5,
      })
      .select('id, module_code')
      .single()

    if (groupError || !group?.id) {
      throw groupError ?? new Error('Failed to create team')
    }

    const { error: profileError } = await db
      .from('profiles')
      .update({ group_id: group.id, role: 'admin' })
      .eq('id', uid)

    if (profileError) throw profileError

    revalidatePath('/', 'layout')
    return { success: true, teamId: group.id, moduleCode: group.module_code ?? undefined }
  } catch (err: unknown) {
    return { error: formatActionError(err, 'Failed to create team') }
  }
}

export async function joinWorkspaceTeam(teamId: string) {
  const uid = await getUid()
  if (!uid) return { error: 'Not authenticated' }

  const trimmedId = teamId.trim()
  if (!trimmedId) return { error: 'Team ID is required' }

  try {
    const db = await getOnboardingDb()
    await ensureProfileRow(uid)

    const { data: group, error: groupError } = await db
      .from('groups')
      .select('id, capacity')
      .eq('id', trimmedId)
      .maybeSingle()

    if (groupError) throw groupError
    if (!group) return { error: 'Team not found. Check the Team ID.' }

    const { data: memberCount, error: memberError } = await db.rpc('group_member_count', {
      target_group_id: group.id,
    })

    if (memberError) throw memberError

    if ((memberCount ?? 0) >= (group.capacity || 5)) {
      return {
        error: `This team has reached its maximum capacity of ${group.capacity || 5} members.`,
      }
    }

    const { error: profileError } = await db
      .from('profiles')
      .update({ group_id: group.id })
      .eq('id', uid)

    if (profileError) throw profileError

    revalidatePath('/', 'layout')
    return { success: true, teamId: group.id }
  } catch (err: unknown) {
    return { error: formatActionError(err, 'Failed to join team') }
  }
}
