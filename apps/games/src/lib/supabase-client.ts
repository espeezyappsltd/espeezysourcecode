import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseEnv } from './supabase-env'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient) {
    const { url, anonKey } = resolveSupabaseEnv()

    if (!url || !anonKey) {
      return null
    }

    supabaseClient = createClient(url, anonKey)
  }

  return supabaseClient
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseClient()
    if (!client) {
      // Return a dummy object to prevent immediate crash, though subsequent calls will likely fail
      return (dummyAuth as any)[prop] || {}
    }
    return Reflect.get(client, prop, receiver)
  },
})

const dummyAuth = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ error: { message: 'Configuration missing' } }),
    signUp: async () => ({ error: { message: 'Configuration missing' } }),
    resetPasswordForEmail: async () => ({ error: { message: 'Configuration missing' } }),
  }
}
