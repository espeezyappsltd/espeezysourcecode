import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _instance: SupabaseClient | null = null

function resolveSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL || 'https://placeholder.supabase.co'
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_ANON_KEY ||
    'placeholder'

  return { url, key }
}

function getInstance(): SupabaseClient {
  if (!_instance) {
    const { url, key } = resolveSupabaseEnv()
    _instance = createClient(url, key)
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
