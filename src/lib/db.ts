import { createClient as createBrowserSupabaseClient } from './supabase/client'
import {
  createAdminSupabaseClient,
  createClient as createServerSupabaseClientInternal,
} from './supabase/server'

export const db = createBrowserSupabaseClient()

export const createAdminClient = async () => createAdminSupabaseClient()
export const createServerSupabaseClient = async () => createServerSupabaseClientInternal()


