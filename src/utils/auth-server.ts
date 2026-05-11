import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminDb } from '@/lib/supabase/admin'

export async function getAuthUser() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))

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

export async function getUserProfile(uid: string) {
  const adminDb = getAdminDb()
  const { data, error } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()

  if (error || !data) return null
  return data
}
