import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/payments/history
 * Fetches both P2P transfers and direct institutional payments (upgrades).
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })

    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const { searchParams } = new URL(req.url)
    const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const direction = searchParams.get('direction') ?? 'all' // 'sent' | 'received' | 'all'

    // 1. Fetch P2P Transfers
    let p2pQuery: any = adminDb.collection('p2p_transfers')
    
    if (direction === 'sent') {
      p2pQuery = p2pQuery.where('sender_id', '==', uid)
    } else if (direction === 'received') {
      p2pQuery = p2pQuery.where('recipient_id', '==', uid)
    } else {
      // Use OR filter for P2P
      const admin = require('firebase-admin')
      p2pQuery = p2pQuery.where(admin.firestore.Filter.or(
        admin.firestore.Filter.where('sender_id', '==', uid),
        admin.firestore.Filter.where('recipient_id', '==', uid)
      ))
    }

    const p2pSnap = await p2pQuery.orderBy('created_at', 'desc').limit(limit * 2).get()
    const p2pTransfers = await Promise.all(p2pSnap.docs.map(async (doc: any) => {
      const data = doc.data()
      // Manual join for profiles
      const [senderSnap, recipientSnap] = await Promise.all([
        adminDb.collection('profiles').doc(data.sender_id).get(),
        adminDb.collection('profiles').doc(data.recipient_id).get()
      ])

      return {
        id: doc.id,
        ...data,
        type: 'p2p',
        sender: senderSnap.exists ? { id: senderSnap.id, ...senderSnap.data() } : null,
        recipient: recipientSnap.exists ? { id: recipientSnap.id, ...recipientSnap.data() } : null
      }
    }))

    // 2. Fetch Direct Payments (Upgrades)
    let paymentsQuery = adminDb.collection('payments').where('user_id', '==', uid)
    const paymentsSnap = await paymentsQuery.orderBy('updated_at', 'desc').limit(limit).get()
    const payments = paymentsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      type: 'upgrade',
      // Map Firestore fields to the expected frontend shape if needed
      amount_cents: doc.data().amount_total, 
      created_at: doc.data().updated_at
    }))

    // 3. Combine and Sort
    const combined = [...p2pTransfers, ...payments].sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.updated_at).getTime()
      const dateB = new Date(b.created_at || b.updated_at).getTime()
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
  } catch (err: any) {
    console.error('Payment history error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
