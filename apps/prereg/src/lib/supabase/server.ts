import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function resolveSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) {
    throw new Error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return { url, anonKey }
}

/** Server route handler / RSC client (session in HTTP cookies). */
export async function createClient() {
  const { url, anonKey } = resolveSupabaseEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            if (name.startsWith('__cf') || name === 'cf_clearance') return;
              cookieStore.set(name, value, options),
          )
        } catch {
          // Server Component — cookies set on next navigation.
        }
      },
    },
  })
}


