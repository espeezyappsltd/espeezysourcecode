import { formatSupabaseError } from '@/utils/supabase-errors'

type PgError = { code?: string; message?: string; details?: string; hint?: string }

function pg(err: unknown): PgError {
  return err && typeof err === 'object' ? (err as PgError) : {}
}

/** User-safe message for team join request failures (never hides PostgREST detail). */
export function friendlyJoinRequestError(err: unknown, fallback = 'Could not send join request'): string {
  if (err instanceof Error && err.message.includes('service role')) {
    return 'Join requests are temporarily unavailable. Please try again later or contact support.'
  }

  const { code, message } = pg(err)
  const raw = formatSupabaseError(err, fallback)
  const lower = raw.toLowerCase()

  if (code === '42P01' || lower.includes('group_join_requests') && lower.includes('does not exist')) {
    return 'Team join requests are not set up on this server yet. Ask your instructor to run the latest database migration.'
  }

  if (code === '23505' || lower.includes('duplicate key') || lower.includes('one_pending_per_team')) {
    return 'You already have a pending request for this team. Check Settings → Workspace or wait for the team lead to respond.'
  }

  if (code === '23503' || lower.includes('foreign key')) {
    return 'This team or your profile could not be found. Refresh the page and try again.'
  }

  if (lower.includes('invalid api key') || lower.includes('jwt')) {
    return 'Your session expired or the app is misconfigured. Sign in again and retry.'
  }

  if (lower.includes('row-level security') || code === '42501') {
    return 'You do not have permission to request this team. Sign in with the account you use for Espeezy.'
  }

  if (message?.includes('capacity') || lower.includes('at capacity')) {
    return 'This team is full. Ask the team lead to increase capacity or free a seat.'
  }

  return raw || fallback
}
