import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

type DonationTotals = {
  total_cents: number
  count: number
  source: 'supabase' | 'proxy' | 'snapshot'
  updated_at: string
}

let lastKnownTotals: DonationTotals = {
  total_cents: 0,
  count: 0,
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

  return {
    total_cents: Number.isFinite(total) ? total : 0,
    count: Number.isFinite(count) ? count : 0,
    source,
    updated_at: new Date().toISOString(),
  }
}

async function fetchTotalsFromSupabase(): Promise<DonationTotals | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) return null

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
