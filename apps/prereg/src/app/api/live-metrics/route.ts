import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

async function fetchDonationFundMetrics(cfg: { url: string; key: string }): Promise<{
  total_cents: number
  donation_count: number
  supporters_count: number
  click_count: number
  click_user_count: number
  conversion_rate_pct: number
} | null> {
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/get_donation_fund_metrics`, {
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
    if (!payload || typeof payload !== 'object') return null

    const obj = payload as Record<string, unknown>
    const totalCents = typeof obj.total_cents === 'number' ? obj.total_cents : 0
    const donationCount = typeof obj.donation_count === 'number' ? obj.donation_count : 0
    const supportersCount = typeof obj.supporters_count === 'number' ? obj.supporters_count : 0
    const clickCount = typeof obj.click_count === 'number' ? obj.click_count : 0
    const clickUserCount = typeof obj.click_user_count === 'number' ? obj.click_user_count : 0
    const conversionRate = typeof obj.conversion_rate_pct === 'number' ? obj.conversion_rate_pct : 0

    return {
      total_cents: Number.isFinite(totalCents) ? totalCents : 0,
      donation_count: Number.isFinite(donationCount) ? donationCount : 0,
      supporters_count: Number.isFinite(supportersCount) ? supportersCount : 0,
      click_count: Number.isFinite(clickCount) ? clickCount : 0,
      click_user_count: Number.isFinite(clickUserCount) ? clickUserCount : 0,
      conversion_rate_pct: Number.isFinite(conversionRate) ? conversionRate : 0,
    }
  } catch {
    return null
  }
}

async function fetchDonationTotalsFromTable(cfg: { url: string; key: string }): Promise<{ total_cents: number; count: number } | null> {
  try {
    const res = await fetch(`${cfg.url}/rest/v1/donations?select=amount_cents,status&status=eq.completed&limit=2000`, {
      method: 'GET',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) return null
    const rows = await res.json()
    if (!Array.isArray(rows)) return { total_cents: 0, count: 0 }

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

  const [preregCount, authUserCount, lifetimeUsed, donationFundMetrics, donationsRpc, donationsTable] = await Promise.all([
    fetchCount(cfg, 'pre_registrations'),
    fetchAuthUserCount(cfg),
    fetchCount(cfg, 'profiles', 'subscription_plan=eq.lifetime'),
    fetchDonationFundMetrics(cfg),
    fetchDonationTotals(cfg),
    fetchDonationTotalsFromTable(cfg),
  ])

  if (preregCount === null || lifetimeUsed === null) return null

  const donations = donationFundMetrics
    ? { total_cents: donationFundMetrics.total_cents, count: donationFundMetrics.donation_count }
    : (donationsRpc ?? donationsTable ?? { total_cents: 0, count: 0 })
  const authCount = authUserCount ?? 0

  return {
    // Registered count displayed on UI should come directly from pre_registrations.
    registered_count: preregCount,
    preregistration_count: preregCount,
    auth_user_count: authCount,
    donation_total_cents: donations.total_cents,
    donation_count: donations.count,
    donation_supporters_count: donationFundMetrics?.supporters_count ?? donations.count,
    donation_click_count: donationFundMetrics?.click_count ?? 0,
    donation_click_user_count: donationFundMetrics?.click_user_count ?? 0,
    donation_conversion_rate_pct: donationFundMetrics?.conversion_rate_pct ?? 0,
    lifetime_seats_used: lifetimeUsed,
    lifetime_seats_remaining: Math.max(0, 100 - lifetimeUsed),
    last_updated_at: new Date().toISOString(),
    source: 'supabase',
  }
}

async function fetchFromProxy(req: Request): Promise<LiveMetrics | null> {
  const [preregisterApi, donationsApi, lifetimeApi] = [
    getMainApi('/api/preregister'),
    getMainApi('/api/donations/total'),
    getMainApi('/api/lifetime-seats'),
  ]

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
    const donationSupportersCount = typeof donationsData.supporters_count === 'number' ? donationsData.supporters_count : donationCount
    const donationClickCount = typeof donationsData.click_count === 'number' ? donationsData.click_count : 0
    const donationClickUserCount = typeof donationsData.click_user_count === 'number' ? donationsData.click_user_count : 0
    const donationConversionRate = typeof donationsData.conversion_rate_pct === 'number' ? donationsData.conversion_rate_pct : 0
    const lifetimeUsed = typeof lifetimeData.count === 'number' ? lifetimeData.count : null

    if (registered === null || donationTotal === null || donationCount === null || lifetimeUsed === null) {
      return null
    }

    return {
      registered_count: registered,
      preregistration_count: registered,
      auth_user_count: 0,
      donation_total_cents: donationTotal,
      donation_count: donationCount,
      donation_supporters_count: donationSupportersCount ?? donationCount,
      donation_click_count: donationClickCount,
      donation_click_user_count: donationClickUserCount,
      donation_conversion_rate_pct: donationConversionRate,
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
