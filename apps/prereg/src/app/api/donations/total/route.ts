import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

function getMainApi(req: Request): string | null {
  const currentOrigin = new URL(req.url).origin
  if (API_ORIGIN === currentOrigin) return null
  return `${API_ORIGIN}/api/donations/total`
}

export async function GET(req: Request) {
  const mainApi = getMainApi(req)
  if (!mainApi) {
    return NextResponse.json({ total: 0, count: 0 }, { status: 503 })
  }

  try {
    const res = await fetch(mainApi, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ total: 0 }, { status: 200 })
  }
}
