import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { resolveSupabaseAnonKey, resolveSupabaseServiceRoleKey, resolveSupabaseUrl } from './env'



/** Server component / Route Handler client (reads session from cookies) */
export async function createClient() {

  const cookieStore = await cookies()
  const supabaseUrl = resolveSupabaseUrl()
  const supabaseAnonKey = resolveSupabaseAnonKey()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (name.startsWith('__cf') || name === 'cf_clearance') return;
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component  -  cookies cannot be set.
            // Middleware keeps session fresh, so this is fine.
          }
        },
      },
    }
  )
}

/** Service-role admin client  -  NEVER use in client components */
export function createAdminSupabaseClient() {
  const supabaseUrl = resolveSupabaseUrl()
  const serviceRoleKey = resolveSupabaseServiceRoleKey()

  return createAdminClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}


