
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from './env'

let browserInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserInstance) return browserInstance
  const options = typeof window === 'undefined' ? { cookies: { getAll: () => [], setAll: () => {} } } : {}
  browserInstance = createBrowserClient(
    resolveSupabaseUrl(),
    resolveSupabaseAnonKey(),
    options
  )
  return browserInstance
}

export function createServerSupabaseClient(): SupabaseClient {
  // Minimal no-op cookies implementation for API/server context
  const cookies = {
    getAll: () => [],
    setAll: () => {},
  }
  return createServerClient(
    resolveSupabaseUrl(),
    resolveSupabaseAnonKey(),
    { cookies }
  )
}
