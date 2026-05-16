import { cache } from 'react'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { Q } from '@/lib/query-columns'
import type { Profile } from '@/types/auth'

export async function getAuthUser() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser().catch(() => ({ data: { user: null } }))

  if (!user) return null

  return {
    uid: user.id,
    email: user.email,
    aud: user.aud,
    role: user.role,
  }
}

export async function getUid() {
  const user = await getAuthUser()
  return user?.uid ?? null
}

/** Deduplicated per-request profile fetch for layout + dashboard. */
export const getCachedUserProfile = cache(async (uid: string): Promise<Profile | null> => {
  const db = await createServerSupabaseClient()
  const { data, error } = await db
    .from('profiles')
    .select(Q.profile.layout)
    .eq('id', uid)
    .maybeSingle()

  if (!error && data) return data as Profile

  const adminDb = getAdminDb()
  const { data: adminData, error: adminError } = await adminDb
    .from('profiles')
    .select(Q.profile.layout)
    .eq('id', uid)
    .maybeSingle()

  if (adminError || !adminData) return null
  return adminData as Profile
})

export async function getUserProfile(uid: string) {
  return getCachedUserProfile(uid)
}
