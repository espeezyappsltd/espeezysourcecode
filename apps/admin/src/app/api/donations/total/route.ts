import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await createAdminClient()
    const { data, error } = await db.rpc('get_donation_total')
    if (error) throw error
    const payload = Array.isArray(data) ? data[0] : data
    const normalized = (payload && typeof payload === 'object')
      ? {
          total_cents: Number((payload as { total_cents?: unknown }).total_cents ?? 0) || 0,
          count: Number((payload as { count?: unknown }).count ?? 0) || 0,
        }
      : { total_cents: 0, count: 0 }

    return NextResponse.json(normalized, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ total_cents: 0, count: 0 }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }
}
