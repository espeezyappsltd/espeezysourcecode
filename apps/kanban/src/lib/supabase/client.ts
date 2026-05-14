import { createClient as createBrowserClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from './env'

let supabaseInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  // Return cached instance if it exists
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = resolveSupabaseUrl()
  const supabaseAnonKey = resolveSupabaseAnonKey()

  supabaseInstance = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )

  return supabaseInstance
}
