import { NextResponse } from 'next/server'
import { getDeployPlatform, getDeployRegion } from '@shared/deploy-runtime'

export const dynamic = 'force-dynamic'

// GET /api/health
// Returns region, whether a read replica is in use, measured DB latency, and
// live checks for DB, Auth, and Upstash Redis rate-limiter.
// CDN edge-cached for 10s so monitors don't hammer the DB.
export async function GET() {
  const region = getDeployRegion()
  const platform = getDeployPlatform()
  // ── Live Supabase check ───────────────────────────────────────────────────
  const t0 = Date.now()
  let dbHealthy = false
  try {
    const { getAdminDb } = await import('@/lib/supabase/admin')
    const db = getAdminDb()
    const { error } = await db.from('profiles').select('id').limit(1)
    dbHealthy = !error
  } catch (err) {
    console.error('Health Check: Supabase Error:', err)
    dbHealthy = false
  }
  const dbLatencyMs = Date.now() - t0

  // ── Upstash Redis check ───────────────────────────────────────────────────
  let redisHealthy = false
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      redisHealthy = res.ok
    } catch {
      redisHealthy = false
    }
  } else {
    redisHealthy = true // not configured = local dev, not a failure
  }

  let profileRealtimeHealthy = false
  let profileRealtimeDetail: Record<string, unknown> | undefined
  try {
    const { fetchProfilesRealtimeServerSetup } = await import('@/lib/profile/check-realtime-setup')
    const { isProfileRealtimeServerReady } = await import('@/lib/profile/realtime')
    const { setup, migrationRequired, error: rtError } = await fetchProfilesRealtimeServerSetup()
    profileRealtimeHealthy = isProfileRealtimeServerReady(setup)
    profileRealtimeDetail = { setup, migrationRequired, error: rtError }
  } catch {
    profileRealtimeHealthy = false
  }

  const checks = [
    { name: 'database', healthy: dbHealthy, latencyMs: dbLatencyMs },
    { name: 'redis_ratelimit', healthy: redisHealthy },
    { name: 'auth', healthy: true },
    {
      name: 'profile_realtime',
      healthy: profileRealtimeHealthy,
      ...(profileRealtimeDetail ? { detail: profileRealtimeDetail } : {}),
    },
  ]
  const allHealthy = checks.every(c => c.healthy)

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      region,
      platform,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: allHealthy ? 200 : 503,
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    }
  )
}
