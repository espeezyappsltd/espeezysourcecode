import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

type DonationTotals = {
  total_cents: number
  count: number
  supporters_count: number
  click_count: number
  click_user_count: number
  conversion_rate_pct: number
  source: 'supabase' | 'proxy' | 'snapshot'
  updated_at: string
}

let lastKnownTotals: DonationTotals = {
  total_cents: 0,
  count: 0,
  supporters_count: 0,
  click_count: 0,
  click_user_count: 0,
  conversion_rate_pct: 0,
  source: 'snapshot',
  updated_at: new Date(0).toISOString(),
}

function getMainApi(): string {
  return `${API_ORIGIN}/api/donations/total`
}

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROJECT_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY ?? '').trim()
  if (!url || !key) return null
  return { url, key }
}

function normalizeTotals(raw: unknown, source: DonationTotals['source']): DonationTotals {
  const obj = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const total = typeof obj.total_cents === 'number'
    ? obj.total_cents
    : typeof obj.total === 'number'
      ? Math.round(obj.total * 100)
      : 0
  const count = typeof obj.count === 'number' ? obj.count : 0
  const supportersCount = typeof obj.supporters_count === 'number' ? obj.supporters_count : count
  const clickCount = typeof obj.click_count === 'number' ? obj.click_count : 0
  const clickUserCount = typeof obj.click_user_count === 'number' ? obj.click_user_count : 0
  const conversionRate = typeof obj.conversion_rate_pct === 'number' ? obj.conversion_rate_pct : 0

  return {
    total_cents: Number.isFinite(total) ? total : 0,
    count: Number.isFinite(count) ? count : 0,
    supporters_count: Number.isFinite(supportersCount) ? supportersCount : 0,
    click_count: Number.isFinite(clickCount) ? clickCount : 0,
    click_user_count: Number.isFinite(clickUserCount) ? clickUserCount : 0,
    conversion_rate_pct: Number.isFinite(conversionRate) ? conversionRate : 0,
    source,
    updated_at: new Date().toISOString(),
  }
}

async function fetchTotalsFromSupabase(): Promise<DonationTotals | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) return null

  try {
    const metricsRes = await fetch(`${cfg.url}/rest/v1/rpc/get_donation_fund_metrics`, {
      method: 'POST',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
    })

    if (metricsRes.ok) {
      const metricsData = await metricsRes.json()
      const payload = Array.isArray(metricsData) ? metricsData[0] : metricsData
      return normalizeTotals(
        {
          total_cents: (payload as Record<string, unknown>)?.total_cents,
          count: (payload as Record<string, unknown>)?.donation_count,
          supporters_count: (payload as Record<string, unknown>)?.supporters_count,
          click_count: (payload as Record<string, unknown>)?.click_count,
          click_user_count: (payload as Record<string, unknown>)?.click_user_count,
          conversion_rate_pct: (payload as Record<string, unknown>)?.conversion_rate_pct,
        },
        'supabase'
      )
    }
  } catch {
    // Fall through to legacy totals RPC.
  }

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
    return normalizeTotals(payload, 'supabase')
  } catch {
    // Fall through to direct table aggregation.
  }

  try {
    const rowsRes = await fetch(`${cfg.url}/rest/v1/donations?select=amount_cents,status&status=eq.completed&limit=2000`, {
      method: 'GET',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
      cache: 'no-store',
    })

    if (!rowsRes.ok) return null
    const rows = await rowsRes.json()
    if (!Array.isArray(rows)) return normalizeTotals({ total_cents: 0, count: 0, supporters_count: 0, click_count: 0, click_user_count: 0, conversion_rate_pct: 0 }, 'supabase')

    let total = 0
    for (const row of rows as Array<Record<string, unknown>>) {
      const cents = row.amount_cents
      if (typeof cents === 'number' && Number.isFinite(cents)) total += cents
    }

    return normalizeTotals({ total_cents: total, count: rows.length, supporters_count: rows.length, click_count: 0, click_user_count: 0, conversion_rate_pct: 0 }, 'supabase')
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const supabaseTotals = await fetchTotalsFromSupabase()
  if (supabaseTotals) {
    lastKnownTotals = supabaseTotals
    return NextResponse.json(supabaseTotals, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  }

  const mainApi = getMainApi()
  
  try {
    const res = await fetch(mainApi, { method: 'GET', cache: 'no-store' })
    const data = await res.json()
    const normalized = normalizeTotals(data, 'proxy')
    lastKnownTotals = normalized
    return NextResponse.json(normalized, {
      status: res.status,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch {
    return NextResponse.json({ ...lastKnownTotals, source: 'snapshot' }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  }
}
