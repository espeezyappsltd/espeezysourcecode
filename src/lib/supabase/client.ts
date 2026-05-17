import { createBrowserClient } from '@supabase/ssr'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from './env'

export function createClient() {
  return createBrowserClient(resolveSupabaseUrl(), resolveSupabaseAnonKey())
}
