import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://www.espeezy.com').replace(/\/$/, '')

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const res = await fetch(`${API_ORIGIN}/api/chat/presence`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/json',
      },
      body,
    })

    if (res.status === 404) {
      return NextResponse.json({ ok: true, queued: false }, { status: 202 })
    }

    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return NextResponse.json({ ok: true, queued: false }, { status: 202 })
  }
}
