import { NextResponse } from 'next/server'
import { fetchProfilesRealtimeServerSetup } from '@/lib/profile/check-realtime-setup'
import { isProfileRealtimeServerReady } from '@/lib/profile/realtime'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health/profile-realtime
 * Validates Supabase Realtime prerequisites for public.profiles.
 */
export async function GET() {
  const { setup, error, migrationRequired } = await fetchProfilesRealtimeServerSetup()
  const ready = isProfileRealtimeServerReady(setup)

  return NextResponse.json(
    {
      status: ready ? 'ok' : migrationRequired || error ? 'misconfigured' : 'unknown',
      ready,
      setup,
      error,
      migrationRequired,
      client: {
        channelPattern: 'profile:{userId}',
        event: 'postgres_changes',
        table: 'public.profiles',
        filter: 'id=eq.{userId}',
        fallbackPollMs: 30_000,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
