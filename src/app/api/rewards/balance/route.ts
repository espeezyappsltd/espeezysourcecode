import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/rewards/balance — current points + recent ledger
export async function GET(req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  const { searchParams } = new URL(req.url)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

  // Get point balance via DB function
  const { data: balanceRow } = await admin
    .rpc('get_user_points', { p_user_id: user.id })

  // Get recent ledger entries
  const { data: ledger } = await admin
    .from('reward_ledger')
    .select('id, type, points, cash_value_cents, description, reference_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Compute total cash prizes won
  const { data: cashTotal } = await admin
    .from('reward_ledger')
    .select('cash_value_cents')
    .eq('user_id', user.id)
    .gt('cash_value_cents', 0)

  const cashRows = (cashTotal ?? []) as Array<{ cash_value_cents: number | null }>
  const totalCashCents = cashRows.reduce((acc: number, r) => acc + (r.cash_value_cents ?? 0), 0)

  return NextResponse.json({
    points_balance: balanceRow ?? 0,
    total_cash_won_cents: totalCashCents,
    recent: ledger ?? [],
  })
}
