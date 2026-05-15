import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

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

    // 1. Fetch P2P Transfers
    let p2pQuery = adminDb
      .from('p2p_transfers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit * 2)
    
    if (direction === 'sent') {
      p2pQuery = p2pQuery.eq('sender_id', uid)
    } else if (direction === 'received') {
      p2pQuery = p2pQuery.eq('recipient_id', uid)
    } else {
      p2pQuery = p2pQuery.or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
    }

    const { data: p2pRows, error: p2pError } = await p2pQuery

    if (p2pError) {
      throw p2pError
    }

    const profileIds = Array.from(new Set((p2pRows ?? []).flatMap((row) => [row.sender_id, row.recipient_id]).filter(Boolean)))
    const { data: profileRows, error: profileError } = profileIds.length > 0
      ? await adminDb.from('profiles').select('*').in('id', profileIds)
      : { data: [], error: null }

    if (profileError) {
      throw profileError
    }

    const profileMap = new Map((profileRows ?? []).map((profile) => [profile.id, profile]))
    const p2pTransfers = (p2pRows ?? []).map((row) => {
      return {
        ...row,
        type: 'p2p',
        sender: profileMap.get(row.sender_id) ?? null,
        recipient: profileMap.get(row.recipient_id) ?? null
      }
    })

    // 2. Fetch Direct Payments (Upgrades)
    const { data: paymentRows, error: paymentError } = await adminDb
      .from('payments')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (paymentError) {
      throw paymentError
    }

    const payments = (paymentRows ?? []).map((payment) => ({
      ...payment,
      type: 'upgrade',
      amount_cents: payment.amount_total,
      created_at: payment.updated_at
    }))

    // 3. Combine and Sort
    const combined = [...p2pTransfers, ...payments].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })

    // 4. Paginate
    const offset = page * limit
    const paginated = combined.slice(offset, offset + limit)

    return NextResponse.json({ 
      transfers: paginated, 
      page, 
      limit,
      total_count: combined.length 
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('Payment history error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
