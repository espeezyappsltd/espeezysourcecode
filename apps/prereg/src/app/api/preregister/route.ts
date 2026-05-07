import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAIN_API = 'https://espeezy.com/api/preregister'

export async function GET() {
  try {
    const res = await fetch(MAIN_API, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Service unavailable.', count: 0 }, { status: 503 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const res = await fetch(MAIN_API, {
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
