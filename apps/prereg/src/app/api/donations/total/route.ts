import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAIN_API = 'https://espeezy.com/api/donations/total'

export async function GET() {
  try {
    const res = await fetch(MAIN_API, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ total: 0 }, { status: 200 })
  }
}
