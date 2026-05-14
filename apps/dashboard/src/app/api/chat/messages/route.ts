import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://www.espeezy.com').replace(/\/$/, '')

async function proxy(req: Request, path: string, method: string) {
  try {
    const body = method === 'GET' ? undefined : await req.text()
    const url = new URL(req.url)
    const target = `${API_ORIGIN}${path}${url.search}`

    const res = await fetch(target, {
      method,
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/json',
        'x-agent-key': req.headers.get('x-agent-key') ?? '',
      },
      body,
    })

    // If upstream chat routes are not deployed yet, provide a safe no-op response.
    if (res.status === 404) {
      if (method === 'GET') {
        return NextResponse.json({ messages: [], new_user_event: null }, { status: 200 })
      }
      return NextResponse.json({ ok: true, queued: false }, { status: 202 })
    }

    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } })
  } catch {
    if (method === 'GET') {
      return NextResponse.json({ messages: [], new_user_event: null }, { status: 200 })
    }
    return NextResponse.json({ ok: true, queued: false }, { status: 202 })
  }
}

export async function GET(req: Request) {
  return proxy(req, '/api/chat/messages', 'GET')
}

export async function POST(req: Request) {
  return proxy(req, '/api/chat/messages', 'POST')
}
