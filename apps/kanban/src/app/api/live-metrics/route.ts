import { NextResponse } from 'next/server'
import { getMarketingOrigin } from '@/lib/marketing-urls'

export const dynamic = 'force-dynamic'

/** Proxy marketing live metrics (lifetime seat counts) for in-app pricing. */
export async function GET() {
  try {
    const res = await fetch(`${getMarketingOrigin()}/api/live-metrics`, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({
        lifetime_seats_used: 0,
        lifetime_seats_remaining: 100,
      })
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({
      lifetime_seats_used: 0,
      lifetime_seats_remaining: 100,
    })
  }
}
