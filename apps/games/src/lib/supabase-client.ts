import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseEnv } from './supabase-env'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const { url, anonKey } = resolveSupabaseEnv()

    if (!url || !anonKey) {
      throw new Error(
        'Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL (or PROJECT_URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
      )
    }

    supabaseClient = createClient(url, anonKey)
  }

  return supabaseClient
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient(), prop, receiver)
  },
})
