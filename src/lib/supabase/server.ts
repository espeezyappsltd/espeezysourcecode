import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { resolveSupabaseAnonKey, resolveSupabaseServiceRoleKey, resolveSupabaseUrl } from './env'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(resolveSupabaseUrl(), resolveSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component — middleware refreshes session
        }
      },
    },
  })
}

export function createAdminClient() {
  return createSupabaseAdminClient(resolveSupabaseUrl(), resolveSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
