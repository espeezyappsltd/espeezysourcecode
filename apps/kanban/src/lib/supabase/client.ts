
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
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
    set: (_name: string, _value: string, _options?: CookieOptions) => {},
    remove: (_name: string, _options?: CookieOptions) => {},
  }
  return createServerClient(
    resolveSupabaseUrl(),
    resolveSupabaseAnonKey(),
    { cookies }
  )
}
