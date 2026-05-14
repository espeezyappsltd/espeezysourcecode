import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from './env'

export function createClient() {
  const supabaseUrl = resolveSupabaseUrl()
  const supabaseAnonKey = resolveSupabaseAnonKey()

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
