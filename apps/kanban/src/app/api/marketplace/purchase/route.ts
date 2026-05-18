import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { executeMarketplaceCreditCheckout } from '@/lib/marketplace/purchase-flow'

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
    const result = await executeMarketplaceCreditCheckout(user.id, listingId)
    return NextResponse.json({
      ok: true,
      ...result,
      invoiceUrl: `/marketplace/invoice/${result.purchaseId}`,
    })
  } catch (err: unknown) {
    const e = err as Error & { code?: string; preflight?: Record<string, unknown> }
    const message = e.message ?? 'Checkout failed'

    if (e.code === 'INSUFFICIENT_CREDITS' && e.preflight) {
      return NextResponse.json(
        {
          error: message,
          message,
          code: 'INSUFFICIENT_CREDITS',
          ...e.preflight,
        },
        { status: 402 },
      )
    }

    const status =
      message.includes('Insufficient') || message.includes('sold') || message.includes('own') || message.includes('not found')
        ? 400
        : 500
    return NextResponse.json({ error: message, message }, { status })
  }
}
