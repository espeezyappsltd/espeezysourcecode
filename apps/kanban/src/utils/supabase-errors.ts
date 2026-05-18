/** Map raw Supabase/PostgREST errors to user-safe messages (never expose key material). */
export function friendlySupabaseError(message: string | undefined, fallback: string): string {
  const msg = message ?? ''
  if (msg.includes('Invalid API key')) {
    return 'Server configuration issue: Supabase keys on Vercel may be missing or incorrect. Ask an admin to verify NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY for the kanban project.'
  }
  if (msg.includes('JWT') && msg.toLowerCase().includes('expired')) {
    return 'Your session expired. Please sign in again.'
  }
  return msg || fallback
}
