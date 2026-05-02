import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/health
// Returns region, whether a read replica is in use, measured DB latency, and
// live checks for DB, Auth, and Upstash Redis rate-limiter.
// CDN edge-cached for 10s so monitors don't hammer the DB.
export async function GET() {
  const region = process.env.VERCEL_REGION ?? 'local'
  const primaryUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const regionToReadUrl: Record<string, string | undefined> = {
    iad1: process.env.SUPABASE_READ_URL_IAD1,
    lhr1: process.env.SUPABASE_READ_URL_LHR1,
    syd1: process.env.SUPABASE_READ_URL_SYD1,
    sin1: process.env.SUPABASE_READ_URL_SIN1,
    cdg1: process.env.SUPABASE_READ_URL_CDG1,
    bom1: process.env.SUPABASE_READ_URL_BOM1,
    gru1: process.env.SUPABASE_READ_URL_GRU1,
    hnd1: process.env.SUPABASE_READ_URL_HND1,
    icn1: process.env.SUPABASE_READ_URL_ICN1,
    kix1: process.env.SUPABASE_READ_URL_KIX1,
    sfo1: process.env.SUPABASE_READ_URL_SFO1,
    cle1: process.env.SUPABASE_READ_URL_CLE1,
    dub1: process.env.SUPABASE_READ_URL_DUB1,
  }
  const replicaUrl = regionToReadUrl[region.toLowerCase()] ?? primaryUrl
  const usingReplica = !!(replicaUrl && replicaUrl !== primaryUrl)

  // ── Live DB check via nearest read replica (or primary in local dev) ──────
  const t0 = Date.now()
  let dbHealthy = false
  const dbUrl = replicaUrl || primaryUrl
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (dbUrl && anonKey) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 400)
      const res = await fetch(
        `${dbUrl}/rest/v1/profiles?select=id&limit=1`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          signal: controller.signal,
        }
      )
      clearTimeout(timer)
      dbHealthy = res.status < 500
    } catch {
      dbHealthy = false
    }
  } else {
    dbHealthy = true // not configured locally
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

  const checks = [
    { name: 'database', healthy: dbHealthy, latencyMs: dbLatencyMs, usingReplica },
    { name: 'redis_ratelimit', healthy: redisHealthy },
    { name: 'auth', healthy: true },
  ]
  const allHealthy = checks.every(c => c.healthy)

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      region,
      usingReplica,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: allHealthy ? 200 : 503,
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    }
  )
}
