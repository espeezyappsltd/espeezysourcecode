import { createClient } from './supabase/client'

/** Supabase browser client — no Firestore or Firebase shims. */
export const db = createClient()

export const createBrowserSupabaseClient = () => db

export default db
