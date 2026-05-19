/** Extract a readable message from PostgREST / Supabase error objects (often log as `{}`). */
export function formatSupabaseError(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [e.message, e.details, e.hint].filter((part) => Boolean(part?.trim()))
    if (parts.length > 0) return parts.join(' — ')
    if (e.code) return `Database error (${e.code})`
  }
  return fallback
}

export function isMissingColumnError(message: string | undefined): boolean {
  const lower = (message ?? '').toLowerCase()
  return lower.includes('column') && (lower.includes('does not exist') || lower.includes('schema cache'))
}

/** Map raw Supabase/PostgREST errors to user-safe messages (never expose key material). */
export function friendlySupabaseError(message: string | undefined, fallback: string): string {
  const msg = message ?? ''
  if (
    msg.includes('activity_logs') &&
    msg.includes('profiles') &&
    msg.toLowerCase().includes('relationship')
  ) {
    return 'Activity history is temporarily unavailable. Charts and team data should still load after a refresh.'
  }
  if (msg.includes('Invalid API key')) {
    return 'Server configuration issue: Supabase keys on Vercel may be missing or incorrect. Ask an admin to verify NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY for the kanban project.'
  }
  if (msg.includes('JWT') && msg.toLowerCase().includes('expired')) {
    return 'Your session expired. Please sign in again.'
  }
  return msg || fallback
}
