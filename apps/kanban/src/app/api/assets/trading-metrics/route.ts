import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { getTradingMetricsForUser } from '@/lib/marketplace/trading-metrics'
import { friendlySupabaseError } from '@/utils/supabase-errors'

export const dynamic = 'force-dynamic'

/** GET /api/assets/trading-metrics — marketplace sales, purchases, withdrawable balance */
export async function GET() {
  try {
    const user = await getRequestUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const metrics = await getTradingMetricsForUser(user.id)
    return NextResponse.json(metrics)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: friendlySupabaseError(message, 'Failed to load trading metrics') },
      { status: 500 },
    )
  }
}
