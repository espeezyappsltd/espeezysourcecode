import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

async function proxy(req: Request, id: string, method: string) {
  try {
    const body = method === 'GET' ? undefined : await req.text()
    const url = new URL(req.url)
    const target = `${API_ORIGIN}/api/chat/messages/${encodeURIComponent(id)}${url.search}`

    const res = await fetch(target, {
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
    return NextResponse.json({ error: 'Chat service unavailable.' }, { status: 503 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxy(req, id, 'GET')
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxy(req, id, 'PATCH')
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxy(req, id, 'DELETE')
}
