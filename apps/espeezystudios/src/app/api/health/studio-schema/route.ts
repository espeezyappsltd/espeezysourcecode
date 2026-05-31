import { NextResponse } from 'next/server'
import { fetchStudioSchemaSetup } from '@/lib/studio/check-schema'

export const dynamic = 'force-dynamic'

/** GET /api/health/studio-schema — validates studio_* tables exist and are readable. */
export async function GET() {
  const result = await fetchStudioSchemaSetup()

  return NextResponse.json(
    {
      status: result.ready ? 'ok' : result.migrationRequired || result.error ? 'misconfigured' : 'unknown',
      ready: result.ready,
      tables: result.tables,
      migrationRequired: result.migrationRequired,
      error: result.error,
      timestamp: new Date().toISOString(),
    },
    {
      status: result.ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
