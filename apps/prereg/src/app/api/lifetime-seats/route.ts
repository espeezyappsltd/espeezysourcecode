import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

function getMainApi(): string {
  return `${API_ORIGIN}/api/lifetime-seats`
}

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROJECT_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY ?? '').trim()
  if (!url || !key) return null
  return { url, key }
}

async function getCountDirect(): Promise<number | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) return null

  try {
    const res = await fetch(`${cfg.url}/rest/v1/profiles?select=id&subscription_plan=eq.lifetime&limit=0`, {
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

export async function GET(req: Request) {
  const direct = await getCountDirect()
  if (direct !== null) {
    return NextResponse.json(
      { count: direct, source: 'supabase' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  }

  const mainApi = getMainApi()

  try {
    const res = await fetch(mainApi, { method: 'GET', cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data, {
      status: res.status,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Service unavailable.', count: 0, source: 'fallback' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  }
}
