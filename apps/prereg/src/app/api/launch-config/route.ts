import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAIN_API = 'https://espeezy.com/api/launch-config'

export async function GET() {
  try {
    const res = await fetch(MAIN_API, { method: 'GET', next: { revalidate: 60 } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      launch_date: null,
      launch_message: 'Espeezy is launching soon.',
      preregister_goal: '5000000',
      preregister_open: 'true',
      brand_name: 'Espeezy',
    }, { status: 200 })
  }
}
