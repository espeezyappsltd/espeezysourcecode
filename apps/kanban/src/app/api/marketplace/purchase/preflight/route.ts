import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { getBuyerCheckoutPreflight } from '@/lib/marketplace/purchase-flow'

export const dynamic = 'force-dynamic'

/** POST /api/marketplace/purchase/preflight — balance check + credit pack payment link */
export async function POST(req: Request) {
  const user = await getRequestUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Please sign in.' }, { status: 401 })
  }

  let listingId: string | undefined
  try {
    const body = await req.json()
    listingId = typeof body?.listingId === 'string' ? body.listingId : undefined
  } catch {
    listingId = undefined
  }

  if (!listingId) {
    return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
  }

  try {
    const preflight = await getBuyerCheckoutPreflight(user.id, listingId)
    return NextResponse.json({
      ok: true,
      ...preflight,
      paymentLinkLabel: preflight.creditTierLabel,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Preflight failed'
    const status = message.includes('own') || message.includes('sold') || message.includes('not found') ? 400 : 500
    return NextResponse.json({ error: message, message }, { status })
  }
}
