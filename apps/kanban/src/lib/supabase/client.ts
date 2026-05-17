import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from './env'

let supabaseInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createBrowserClient(
    resolveSupabaseUrl(),
    resolveSupabaseAnonKey(),
  )

  return supabaseInstance
}
