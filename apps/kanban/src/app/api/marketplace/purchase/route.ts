import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { completeMarketplaceCreditPurchase } from '@/lib/marketplace/checkout-service'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const user = await getRequestUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Please sign in to checkout.' }, { status: 401 })
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
    const result = await completeMarketplaceCreditPurchase(user.id, listingId)
    return NextResponse.json({
      ok: true,
      ...result,
      invoiceUrl: `/marketplace/invoice/${result.purchaseId}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    const status = message.includes('Insufficient') || message.includes('sold') || message.includes('own')
      ? 400
      : 500
    return NextResponse.json({ error: message, message }, { status })
  }
}
