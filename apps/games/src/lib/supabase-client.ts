import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseEnv } from './supabase-env'

let cachedClient: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = resolveSupabaseEnv()
  return Boolean(url && anonKey)
}

/** Browser Supabase client (cookie session for middleware). */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null

  if (cachedClient) return cachedClient

  const { url, anonKey } = resolveSupabaseEnv()
  if (!url || !anonKey) return null

  cachedClient = createBrowserClient(url, anonKey)
  return cachedClient
}

/** @deprecated Prefer getSupabaseClient() — never throws at import time. */
export function getSupabase(): SupabaseClient {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase configuration missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  return client
}
