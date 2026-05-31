import { createClient } from '@/lib/supabase/server'

export async function requireStudioOperator() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false as const, status: 401, message: 'Sign in required.' }
  }

  const allowed =
    user.app_metadata?.role === 'admin' || Boolean(user.email?.endsWith('@espeezy.com'))

  if (!allowed) {
    return { ok: false as const, status: 403, message: 'Studio operator access required.' }
  }

  return { ok: true as const, user, supabase }
}
