import { cache } from 'react'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { Q } from '@/lib/query-columns'
import type { Profile } from '@/types/auth'

/** Single getUser() per request — shared by layout and pages. */
export const getCachedSessionUser = cache(async () => {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser().catch(() => ({ data: { user: null } }))
  return user
})

export const getAuthUser = cache(async () => {
  const user = await getCachedSessionUser()
  if (!user) return null

  return {
    uid: user.id,
    email: user.email,
    aud: user.aud,
    role: user.role,
  }
})

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

/** Reuses cached layout profile when available (one profile query per request). */
export const getCachedUserGroupId = cache(async (uid: string): Promise<string | null> => {
  const profile = await getCachedUserProfile(uid)
  return profile?.group_id ?? null
})

export type LayoutSession = {
  user: NonNullable<Awaited<ReturnType<typeof getCachedSessionUser>>>
  profile: Profile | null
}

/** Layout shell: one auth round-trip + one profile query per navigation. */
export const getCachedLayoutSession = cache(async (): Promise<{
  user: Awaited<ReturnType<typeof getCachedSessionUser>>
  profile: Profile | null
}> => {
  const user = await getCachedSessionUser()
  if (!user) return { user: null, profile: null }
  const profile = await getCachedUserProfile(user.id)
  return { user, profile }
})
