import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { getAdminDb } from '@/lib/supabase/admin'
import { getStripeClient } from '@/utils/stripe'

export const dynamic = 'force-dynamic'

/**
 * GET /api/credits/fund/status?session_id=cs_...
 * Read-only: reports Stripe session + ledger status. Does NOT credit the user (webhook only).
 */
export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionId = new URL(req.url).searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  const db = getAdminDb()
  const { data: ledger } = await db
    .from('credit_fund_checkouts')
    .select('status, credits_amount, amount_gbp, user_id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (ledger && ledger.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (ledger?.status === 'completed') {
    const { data: profile } = await db
      .from('profiles')
      .select('espeezy_credits')
      .eq('id', user.id)
      .maybeSingle()
    return NextResponse.json({
      status: 'completed',
      creditsAmount: ledger.credits_amount,
      amountGbp: ledger.amount_gbp,
      balance: profile?.espeezy_credits ?? 0,
      message: 'Payment received — credits are in your account.',
    })
  }

  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.user_id && session.metadata.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const paid = session.payment_status === 'paid'
    return NextResponse.json({
      status: paid ? 'processing' : session.status ?? 'open',
      paymentStatus: session.payment_status,
      creditsAmount: ledger?.credits_amount ?? Number(session.metadata?.credits_amount ?? 0),
      amountGbp: ledger?.amount_gbp ?? Number(session.metadata?.amount_gbp ?? 0),
      message: paid
        ? 'Payment confirmed — your credits will appear in a few seconds.'
        : 'Waiting for payment to complete.',
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not verify session' },
      { status: 500 },
    )
  }
}
