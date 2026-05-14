import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

async function proxy(req: Request, method: string) {
  try {
    const body = method === 'GET' ? undefined : await req.text()
    const url = new URL(req.url)
    const res = await fetch(`${API_ORIGIN}/api/user-profiles${url.search}`, {
      method,
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/json',
        'x-agent-key': req.headers.get('x-agent-key') ?? '',
      },
      body,
    })

    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return NextResponse.json({ error: 'User profile service unavailable.' }, { status: 503 })
  }
}

export async function GET(req: Request) {
  return proxy(req, 'GET')
}

export async function POST(req: Request) {
  return proxy(req, 'POST')
}
