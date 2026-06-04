import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _instance: SupabaseClient | null = null

function getInstance(): SupabaseClient {
  if (!_instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    const options = typeof window === 'undefined' ? { cookies: { getAll: () => [], setAll: () => {} } } : {}
    _instance = createBrowserClient(url, key, options)
  }
  return _instance
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_: SupabaseClient, prop: string | symbol) {
    const client = getInstance()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? (value as Function).bind(client) : value
  },
})
