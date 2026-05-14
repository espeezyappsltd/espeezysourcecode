import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminDb } from '@/lib/supabase/admin'

export async function getAuthUser() {
  const db = await createServerSupabaseClient()
  const { data: { user: realUser } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))

  // MOCK USER FOR TESTING
  const user = realUser || {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
  }

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
  if (uid === '00000000-0000-0000-0000-000000000000') {
    return {
      id: uid,
      full_name: 'Test User',
      subscription_plan: 'pro',
      group_id: '00000000-0000-0000-0000-000000000000', // Use a valid UUID for mock group
      theme_config: { palette: 'Google Light' }
    }
  }

  const adminDb = getAdminDb()
  const { data, error } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()

  if (error || !data) return null
  return data
}
