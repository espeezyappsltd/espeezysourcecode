import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import {
  DEFAULT_CREDIT_FUND_GBP,
  createCreditFundCheckout,
  creditsToFundGbp,
  gbpToCredits,
  validateFundAmountGbp,
} from '@/lib/credits/fund-stripe'

export const dynamic = 'force-dynamic'

/**
 * POST /api/credits/fund
 * Body: { amountGbp?: number, creditsAmount?: number, returnPath?: string, listingId?: string, contextLabel?: string }
 * Returns Stripe Checkout URL — credits are applied only after webhook confirms payment.
 */
export async function POST(req: Request) {
  const user = await getRequestUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  let amountGbp: number
  if (body.creditsAmount != null && body.creditsAmount !== '') {
    amountGbp = creditsToFundGbp(Number(body.creditsAmount))
  } else if (body.amountGbp != null && body.amountGbp !== '') {
    const v = validateFundAmountGbp(body.amountGbp)
    if (!v.ok) return NextResponse.json({ error: v.message }, { status: 422 })
    amountGbp = v.amountGbp
  } else {
    amountGbp = DEFAULT_CREDIT_FUND_GBP
  }

  const returnPath = typeof body.returnPath === 'string' ? body.returnPath : '/account/credits'
  const listingId = typeof body.listingId === 'string' ? body.listingId : undefined
  const contextLabel = typeof body.contextLabel === 'string' ? body.contextLabel : undefined

  const db = getAdminDb()
  const { data: profile } = await db.from('profiles').select('email').eq('id', user.id).maybeSingle()

  try {
    const result = await createCreditFundCheckout({
      userId: user.id,
      email: profile?.email ?? user.email ?? undefined,
      amountGbp,
      returnPath,
      listingId,
      contextLabel,
    })

    const { error: ledgerError } = await db.from('credit_fund_checkouts').upsert(
      {
        user_id: user.id,
        stripe_session_id: result.sessionId,
        amount_gbp: result.amountGbp,
        credits_amount: result.creditsAmount,
        status: 'pending',
        return_path: returnPath,
        listing_id: listingId ?? null,
      },
      { onConflict: 'stripe_session_id' },
    )
    if (ledgerError) {
      console.warn('[credits/fund] ledger upsert skipped:', ledgerError.message)
    }

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
      amountGbp: result.amountGbp,
      creditsAmount: result.creditsAmount,
      creditsPreview: gbpToCredits(result.amountGbp),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not start checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
