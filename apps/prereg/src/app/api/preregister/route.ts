import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

function getMainApi(req: Request): string | null {
  const currentOrigin = new URL(req.url).origin
  if (API_ORIGIN === currentOrigin) return null
  return `${API_ORIGIN}/api/preregister`
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
    const res = await fetch(`${cfg.url}/rest/v1/pre_registrations?select=*&limit=0`, {
      method: 'GET',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Prefer: 'count=exact',
      },
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
  // Try direct Supabase count first (bypasses proxy chain)
  const direct = await getCountDirect()
  if (direct !== null) {
    return NextResponse.json({ count: direct })
  }

  // Fall back to proxying to root app
  const mainApi = getMainApi(req)
  if (!mainApi) {
    return NextResponse.json({ error: 'API proxy origin misconfigured.', count: 0 }, { status: 503 })
  }

  try {
    const res = await fetch(mainApi, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Service unavailable.', count: 0 }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const mainApi = getMainApi(req)
  if (!mainApi) {
    return NextResponse.json({ error: 'API proxy origin misconfigured.' }, { status: 503 })
  }

  try {
    const body = await req.text()
    const res = await fetch(mainApi, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/json',
        'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
        'user-agent': req.headers.get('user-agent') ?? '',
      },
      body,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Network error. Please check your connection.' }, { status: 503 })
  }
}
