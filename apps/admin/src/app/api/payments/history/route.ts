import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import type { Profile } from '@/types/database'
import type {
  CombinedPaymentHistoryItem,
  P2pTransferRow,
  P2pTransferWithProfiles,
  PaymentHistoryItem,
  PaymentRow,
} from '@/types/api'
import { getErrorMessage } from '@/utils/errors'

export const dynamic = 'force-dynamic'

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
    const direction = searchParams.get('direction') ?? 'all' // 'sent' | 'received' | 'all'

    const fetchLimit = page * limit + limit

    let p2pQuery = adminDb
      .from('p2p_transfers')
      .select('id, sender_id, recipient_id, amount_cents, currency, status, message, created_at')
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
      .select('id, user_id, amount_total, currency, status, updated_at, stripe_session_id')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
      .limit(fetchLimit)

    const [{ data: p2pRows, error: p2pError }, { data: paymentRows, error: paymentError }] =
      await Promise.all([p2pQuery, paymentsQuery])

    if (p2pError) throw p2pError
    if (paymentError) throw paymentError

    const profileIds = Array.from(
      new Set(
        (p2pRows ?? []).flatMap((row: P2pTransferRow) => [row.sender_id, row.recipient_id]).filter(Boolean),
      ),
    )
    const { data: profileRows, error: profileError } = profileIds.length > 0
      ? await adminDb.from('profiles').select('id, full_name, avatar_url, username').in('id', profileIds)
      : { data: [] as Profile[], error: null }

    if (profileError) throw profileError

    const profileMap = new Map(
      (profileRows ?? []).map((profile) => [profile.id, profile as Profile]),
    )
    const p2pTransfers: P2pTransferWithProfiles[] = (p2pRows ?? []).map((row: P2pTransferRow) => ({
      ...row,
      type: 'p2p',
      sender: profileMap.get(row.sender_id) ?? null,
      recipient: profileMap.get(row.recipient_id) ?? null,
    }))

    const payments: PaymentHistoryItem[] = (paymentRows ?? []).map((payment: PaymentRow) => ({
      ...payment,
      type: 'upgrade',
      amount_cents: payment.amount_total,
      created_at: payment.updated_at,
    }))

    // 3. Combine and Sort
    const combined: CombinedPaymentHistoryItem[] = [...p2pTransfers, ...payments].sort((a, b) => {
      const dateA = new Date(a.created_at ?? ('updated_at' in a ? a.updated_at : 0) ?? 0).getTime()
      const dateB = new Date(b.created_at ?? ('updated_at' in b ? b.updated_at : 0) ?? 0).getTime()
      return dateB - dateA
    })

    // 4. Paginate
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
    console.error('Payment history error:', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
