import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

function getMainApi(): string {
  return `${API_ORIGIN}/api/stripe/donate`
}

export async function POST(req: Request) {
  const mainApi = getMainApi()

  try {
    const body = await req.text()
    const currentOrigin = new URL(req.url).origin
    const res = await fetch(mainApi, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/json',
        'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
        'user-agent': req.headers.get('user-agent') ?? '',
        'x-app-origin': currentOrigin,
      },
      body,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Donation service unavailable.' }, { status: 503 })
  }
}
