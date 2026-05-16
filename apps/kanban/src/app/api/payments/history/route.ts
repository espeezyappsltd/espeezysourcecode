import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const P2P_COLUMNS =
  'id, sender_id, recipient_id, amount_cents, currency, status, message, created_at'
const PAYMENT_COLUMNS = 'id, user_id, amount_total, currency, status, updated_at, stripe_session_id'

/**
 * GET /api/payments/history
 * Fetches both P2P transfers and direct institutional payments (upgrades).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminDb = getAdminDb()
    const uid = user.id

    const { searchParams } = new URL(req.url)
    const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const direction = searchParams.get('direction') ?? 'all'

    const fetchLimit = page * limit + limit

    let p2pQuery = adminDb
      .from('p2p_transfers')
      .select(P2P_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(fetchLimit)

    if (direction === 'sent') {
      p2pQuery = p2pQuery.eq('sender_id', uid)
    } else if (direction === 'received') {
      p2pQuery = p2pQuery.eq('recipient_id', uid)
    } else {
      p2pQuery = p2pQuery.or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
    }

    const paymentsQuery = adminDb
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
      .limit(fetchLimit)

    const [{ data: p2pRows, error: p2pError }, { data: paymentRows, error: paymentError }] =
      await Promise.all([p2pQuery, paymentsQuery])

    if (p2pError) throw p2pError
    if (paymentError) throw paymentError

    const profileIds = Array.from(
      new Set((p2pRows ?? []).flatMap((row) => [row.sender_id, row.recipient_id]).filter(Boolean)),
    )

    const { data: profileRows, error: profileError } =
      profileIds.length > 0
        ? await adminDb
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .in('id', profileIds)
        : { data: [], error: null }

    if (profileError) throw profileError

    const profileMap = new Map((profileRows ?? []).map((profile) => [profile.id, profile]))

    const p2pTransfers = (p2pRows ?? []).map((row) => ({
      ...row,
      type: 'p2p' as const,
      sender: profileMap.get(row.sender_id) ?? null,
      recipient: profileMap.get(row.recipient_id) ?? null,
    }))

    const payments = (paymentRows ?? []).map((payment) => ({
      ...payment,
      type: 'upgrade' as const,
      amount_cents: payment.amount_total,
      created_at: payment.updated_at,
    }))

    const combined = [...p2pTransfers, ...payments].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const offset = page * limit
    const paginated = combined.slice(offset, offset + limit)

    return NextResponse.json({
      transfers: paginated,
      page,
      limit,
      total_count: combined.length,
      has_more: combined.length > offset + limit,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('Payment history error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
