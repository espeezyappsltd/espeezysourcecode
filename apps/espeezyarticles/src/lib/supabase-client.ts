import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

function missingEnvClient(): SupabaseClient {
  const message =
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to apps/espeezyarticles/.env.local (copy from apps/kanban/.env.local).'
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(message)
    },
  })
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : missingEnvClient()
