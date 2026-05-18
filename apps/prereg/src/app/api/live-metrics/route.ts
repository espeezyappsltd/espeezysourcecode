import { NextResponse } from 'next/server'
import { CACHE_HEADERS, getCached } from '@/utils/server-cache'

export const dynamic = 'force-dynamic'

const METRICS_CACHE_MS = 20_000

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

type LiveMetrics = {
  registered_count: number
  preregistration_count: number
  auth_user_count: number
  donation_total_cents: number
  donation_count: number
  donation_supporters_count: number
  donation_click_count: number
  donation_click_user_count: number
  donation_conversion_rate_pct: number
  lifetime_seats_used: number
  lifetime_seats_remaining: number
  last_updated_at: string
  source: 'supabase' | 'proxy' | 'snapshot'
}

const ZERO_METRICS: LiveMetrics = {
  registered_count: 0,
  preregistration_count: 0,
  auth_user_count: 0,
  donation_total_cents: 0,
  donation_count: 0,
  donation_supporters_count: 0,
  donation_click_count: 0,
  donation_click_user_count: 0,
  donation_conversion_rate_pct: 0,
  lifetime_seats_used: 0,
  lifetime_seats_remaining: 100,
  last_updated_at: new Date(0).toISOString(),
  source: 'snapshot',
}

let lastKnownMetrics: LiveMetrics = ZERO_METRICS

function getMainApi(path: string): string {
  return `${API_ORIGIN}${path}`
}

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROJECT_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY ?? '').trim()
  if (!url || !key) return null
  return { url, key }
}

async function fetchCount(
  cfg: { url: string; key: string },
  tableName: string,
  extraQuery?: string,
): Promise<number | null> {
  try {
    const qp = extraQuery ? `&${extraQuery}` : ''
    const res = await fetch(`${cfg.url}/rest/v1/${tableName}?select=id&limit=0${qp}`, {
      method: 'GET',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Prefer: 'count=exact',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const range = res.headers.get('content-range')
    if (!range) return 0
    const total = Number(range.split('/')[1] ?? '0')
    return Number.isFinite(total) ? total : 0
  } catch {
    return null
  }
}

async function _removedDonationHelpers() {
  let total = 0
    for (const row of rows as Array<Record<string, unknown>>) {
      const cents = row.amount_cents
      if (typeof cents === 'number' && Number.isFinite(cents)) total += cents
    }

    return { total_cents: total, count: rows.length }
  } catch {
    return null
  }
}

async function fetchAuthUserCount(cfg: { url: string; key: string }): Promise<number | null> {
  try {
    const res = await fetch(`${cfg.url}/auth/v1/admin/users?page=1&per_page=1`, {
      method: 'GET',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = await res.json()
    const total = (data && typeof data === 'object') ? (data as Record<string, unknown>).total : null
    if (typeof total === 'number' && Number.isFinite(total)) return total

    const users = (data && typeof data === 'object') ? (data as Record<string, unknown>).users : null
    if (Array.isArray(users)) return users.length

    return null
  } catch {
    return null
  }
}

async function fetchFromSupabase(): Promise<LiveMetrics | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) return null

  const [preregCount, lifetimeUsed] = await Promise.all([
    fetchCount(cfg, 'pre_registrations'),
    fetchCount(cfg, 'profiles', 'subscription_plan=eq.lifetime'),
  ])

  if (preregCount === null || lifetimeUsed === null) return null

  return {
    // Registered count displayed on UI should come directly from pre_registrations.
    registered_count: preregCount,
    preregistration_count: preregCount,
    auth_user_count: preregCount,
    donation_total_cents: 0,
    donation_count: 0,
    donation_supporters_count: 0,
    donation_click_count: 0,
    donation_click_user_count: 0,
    donation_conversion_rate_pct: 0,
    lifetime_seats_used: lifetimeUsed,
    lifetime_seats_remaining: Math.max(0, 100 - lifetimeUsed),
    last_updated_at: new Date().toISOString(),
    source: 'supabase',
  }
}

async function fetchFromProxy(req: Request): Promise<LiveMetrics | null> {
  const [preregisterApi, lifetimeApi] = [
    getMainApi('/api/preregister'),
    getMainApi('/api/lifetime-seats'),
  ]

  try {
    const [preregisterRes, lifetimeRes] = await Promise.all([
      fetch(preregisterApi, { cache: 'no-store' }),
      fetch(lifetimeApi, { cache: 'no-store' }),
    ])

    const preregisterData = await preregisterRes.json()
    const lifetimeData = await lifetimeRes.json()

    const registered = typeof preregisterData.count === 'number' ? preregisterData.count : null
    const lifetimeUsed = typeof lifetimeData.count === 'number' ? lifetimeData.count : null

    if (registered === null || lifetimeUsed === null) {
      return null
    }

    return {
      registered_count: registered,
      preregistration_count: registered,
      auth_user_count: 0,
      donation_total_cents: 0,
      donation_count: 0,
      donation_supporters_count: 0,
      donation_click_count: 0,
      donation_click_user_count: 0,
      donation_conversion_rate_pct: 0,
      lifetime_seats_used: lifetimeUsed,
      lifetime_seats_remaining: Math.max(0, 100 - lifetimeUsed),
      last_updated_at: new Date().toISOString(),
      source: 'proxy',
    }
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const metrics = await getCached('prereg:live-metrics', METRICS_CACHE_MS, async () => {
    const supabaseMetrics = await fetchFromSupabase()
    if (supabaseMetrics) {
      lastKnownMetrics = supabaseMetrics
      return supabaseMetrics
    }

    const proxyMetrics = await fetchFromProxy(req)
    if (proxyMetrics) {
      lastKnownMetrics = proxyMetrics
      return proxyMetrics
    }

    return { ...lastKnownMetrics, source: 'snapshot' as const }
  })

  return NextResponse.json(metrics, { headers: CACHE_HEADERS.publicShort })
}
