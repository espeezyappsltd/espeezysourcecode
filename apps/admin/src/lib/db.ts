import {
  createAdminSupabaseClient,
  createClient as createServerSupabaseClientInternal,
} from './supabase/server'

export const createAdminClient = async () => createAdminSupabaseClient()
export const createServerSupabaseClient = async () => createServerSupabaseClientInternal()


