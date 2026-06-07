import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveSupabaseEnv } from '@/lib/supabase-env'

export async function createClient() {
  const { url, anonKey } = resolveSupabaseEnv()
  if (!url || !anonKey) {
    throw new Error('Missing Supabase configuration for server auth.')
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
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
          // Server Component - middleware/proxy refreshes session on navigations.
        }
      },
    },
  })
}
