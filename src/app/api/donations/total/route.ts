import { NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await createAdminClient()
    const { data, error } = await db.rpc('get_donation_total')
    if (error) throw error
    return NextResponse.json(data ?? { total_cents: 0, count: 0 }, {
      headers: {
        // Cache at the CDN edge for 60 s; browsers revalidate every 30 s
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch {
    return NextResponse.json({ total_cents: 0, count: 0 })
  }
}
