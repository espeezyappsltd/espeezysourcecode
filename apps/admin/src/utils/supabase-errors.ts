/** Extract a readable message from PostgREST / Supabase error objects. */
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
