import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseEnv } from '@/lib/supabase-env'

export function createAdminClient() {
  const { url } = resolveSupabaseEnv()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for studio delivery API.')
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
