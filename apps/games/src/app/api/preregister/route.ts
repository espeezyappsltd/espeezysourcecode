import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

function getMainApi(): string {
  return `${API_ORIGIN}/api/preregister`
}

export async function GET(req: Request) {
  const mainApi = getMainApi()

  try {
    const res = await fetch(mainApi, { method: 'GET', cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Service unavailable.', count: 0 }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const mainApi = getMainApi()

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
