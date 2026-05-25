
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from './env'

let browserInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserInstance) return browserInstance
  browserInstance = createBrowserClient(
    resolveSupabaseUrl(),
    resolveSupabaseAnonKey(),
  )
  return browserInstance
}

export function createServerSupabaseClient(): SupabaseClient {
  // Minimal no-op cookies implementation for API/server context
  const cookies = {
    get: (name: string) => undefined,
    set: (name: string, value: string, options?: any) => {},
    remove: (name: string, options?: any) => {},
  }
  return createServerClient(
    resolveSupabaseUrl(),
    resolveSupabaseAnonKey(),
    { cookies }
  )
}
