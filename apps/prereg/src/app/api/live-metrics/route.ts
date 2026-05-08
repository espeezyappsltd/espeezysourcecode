import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

type LiveMetrics = {
  registered_count: number
  donation_total_cents: number
  donation_count: number
  lifetime_seats_used: number
  lifetime_seats_remaining: number
  last_updated_at: string
  source: 'supabase' | 'proxy' | 'snapshot'
}

const ZERO_METRICS: LiveMetrics = {
  registered_count: 0,
  donation_total_cents: 0,
  donation_count: 0,
  lifetime_seats_used: 0,
  lifetime_seats_remaining: 100,
  last_updated_at: new Date(0).toISOString(),
  source: 'snapshot',
}

let lastKnownMetrics: LiveMetrics = ZERO_METRICS

function getMainApi(req: Request, path: string): string | null {
  const currentOrigin = new URL(req.url).origin
  if (API_ORIGIN === currentOrigin) return null
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
    const res = await fetch(`${cfg.url}/rest/v1/${tableName}?select=*&limit=0${qp}`, {
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

async function fetchDonationTotals(cfg: { url: string; key: string }): Promise<{ total_cents: number; count: number } | null> {
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/get_donation_total`, {
      method: 'POST',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const payload = Array.isArray(data) ? data[0] : data
    if (!payload || typeof payload !== 'object') return { total_cents: 0, count: 0 }
    const total = (payload as Record<string, unknown>).total_cents
    const count = (payload as Record<string, unknown>).count
    return {
      total_cents: typeof total === 'number' && Number.isFinite(total) ? total : 0,
      count: typeof count === 'number' && Number.isFinite(count) ? count : 0,
    }
  } catch {
    return null
  }
}

async function fetchFromSupabase(): Promise<LiveMetrics | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) return null

  const [registeredCount, lifetimeUsed, donations] = await Promise.all([
    fetchCount(cfg, 'pre_registrations'),
    fetchCount(cfg, 'profiles', 'subscription_plan=eq.lifetime'),
    fetchDonationTotals(cfg),
  ])

  if (registeredCount === null || lifetimeUsed === null || donations === null) return null

  return {
    registered_count: registeredCount,
    donation_total_cents: donations.total_cents,
    donation_count: donations.count,
    lifetime_seats_used: lifetimeUsed,
    lifetime_seats_remaining: Math.max(0, 100 - lifetimeUsed),
    last_updated_at: new Date().toISOString(),
    source: 'supabase',
  }
}

async function fetchFromProxy(req: Request): Promise<LiveMetrics | null> {
  const [preregisterApi, donationsApi, lifetimeApi] = [
    getMainApi(req, '/api/preregister'),
    getMainApi(req, '/api/donations/total'),
    getMainApi(req, '/api/lifetime-seats'),
  ]

  if (!preregisterApi || !donationsApi || !lifetimeApi) return null

  try {
    const [preregisterRes, donationsRes, lifetimeRes] = await Promise.all([
      fetch(preregisterApi, { cache: 'no-store' }),
      fetch(donationsApi, { cache: 'no-store' }),
      fetch(lifetimeApi, { cache: 'no-store' }),
    ])

    const preregisterData = await preregisterRes.json()
    const donationsData = await donationsRes.json()
    const lifetimeData = await lifetimeRes.json()

    const registered = typeof preregisterData.count === 'number' ? preregisterData.count : null
    const donationTotal = typeof donationsData.total_cents === 'number' ? donationsData.total_cents : null
    const donationCount = typeof donationsData.count === 'number' ? donationsData.count : null
    const lifetimeUsed = typeof lifetimeData.count === 'number' ? lifetimeData.count : null

    if (registered === null || donationTotal === null || donationCount === null || lifetimeUsed === null) {
      return null
    }

    return {
      registered_count: registered,
      donation_total_cents: donationTotal,
      donation_count: donationCount,
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
  const supabaseMetrics = await fetchFromSupabase()
  if (supabaseMetrics) {
    lastKnownMetrics = supabaseMetrics
    return NextResponse.json(supabaseMetrics, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  }

  const proxyMetrics = await fetchFromProxy(req)
  if (proxyMetrics) {
    lastKnownMetrics = proxyMetrics
    return NextResponse.json(proxyMetrics, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  }

  return NextResponse.json({ ...lastKnownMetrics, source: 'snapshot' }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
