/**
 * Supabase Admin Client Wrapper
 * 
 * Replaces firebase-admin.ts with Supabase equivalents.
 * Provides admin/service-role access to database, auth, and storage.
 * 
 * SECURITY: These exports must ONLY be used server-side (API routes, server actions).
 * Never use createAdminClient() or getAdminDb() in client components.
 */

import { createAdminSupabaseClient } from './server'

/**
 * Get admin Supabase client for database operations (service-role access)
 * @returns Supabase admin client instance
 */
export function getAdminDb() {
  return createAdminSupabaseClient()
}

/**
 * Get admin auth client (Supabase Auth via admin client)
 * The admin client has full access to auth methods without RLS restrictions
 * @returns Supabase admin client (auth available via client.auth)
 */
export function getAdminAuth() {
  return createAdminSupabaseClient().auth
}

/**
 * Get admin storage client (Supabase Storage via admin client)
 * The admin client has full access to storage without RLS restrictions
 * @returns Supabase admin client (storage available via client.storage)
 */
export function getAdminStorage() {
  return createAdminSupabaseClient().storage
}

/**
 * Supabase does not have a separate Realtime Database module like Firebase.
 * Use getAdminDb() for all data operations including realtime via PostgRES changes.
 * This function is kept for API compatibility but returns the admin client.
 * @returns Supabase admin client
 */
export function getAdminDatabase() {
  return createAdminSupabaseClient()
}
