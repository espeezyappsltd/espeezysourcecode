import { createClient } from './supabase/client'

// Initialize the native Supabase client
export const db = createClient()

/**
 * Cleaned up db-client for Admin application.
 * All legacy Firebase-dependent shims have been removed.
 * This implementation provides a Supabase-native experience while maintaining
 * compatibility with existing code that expects a 'db' or 'client' object.
 */

export const auth = db.auth
export const storage = db.storage

// Helpers to maintain compatibility with code that uses Firestore-like syntax
export const collection = (_db: any, name: string) => name
export const doc = (_db: any, name: string, id: string) => ({ table: name, id })
export const query = (table: string, ...constraints: any[]) => {
  let builder = db.from(table).select('*')
  // Note: This is a simplified version. Full query construction usually 
  // happens at the call site in native Supabase.
  return { table, builder }
}

export const onAuthStateChanged = (cb: any) => {
  const { data } = db.auth.onAuthStateChange((_event, session) => {
    cb(session?.user || null)
  })
  return () => data.subscription.unsubscribe()
}

export const createBrowserSupabaseClient = () => db
export const createClientAlias = () => db

export default db
