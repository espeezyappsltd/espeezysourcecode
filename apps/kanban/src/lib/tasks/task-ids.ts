const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** True when id is a persisted Supabase uuid (not a client optimistic placeholder). */
export function isPersistedTaskId(id: string | null | undefined): id is string {
  return typeof id === 'string' && UUID_RE.test(id)
}
