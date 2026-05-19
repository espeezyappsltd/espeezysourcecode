import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
// import { paymentWorkflow, type PaymentWorkflowPayload } from '@/workflows/paymentWorkflow'
import { getAdminDb } from '@/lib/supabase/admin'
import { sendP2PTransactionEmail } from '@/services/email'
import { applyCreditTopupFromStripeSession } from '@/lib/credits/apply-credit-topup'
import { getStripeClient, getStripeWebhookSecret } from '@/utils/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const adminDb = getAdminDb()
  if (!adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let stripe: Stripe
  let webhookSecret: string
  try {
    stripe = getStripeClient()
    webhookSecret = getStripeWebhookSecret()
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Stripe not configured' }, { status: 500 })
  }

  const rawBody = Buffer.from(await req.arrayBuffer())

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error: unknown) {
    return NextResponse.json({ error: `Stripe webhook verification failed: ${error instanceof Error ? error.message : 'unknown error'}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.type === 'p2p_transfer') {
      await handleP2PTransferWebhook(session)
      return NextResponse.json({ ok: true, handled: 'p2p_transfer' }, { status: 200 })
    }

    if (session.metadata?.type === 'credit_topup') {
      await handleCreditTopUpWebhook(session)
      return NextResponse.json({ ok: true, handled: 'credit_topup' }, { status: 200 })
    }

    // Standard subscription/payment
    await handleSubscriptionWebhook(session)
    return NextResponse.json({ ok: true, handled: 'subscription' }, { status: 200 })
  }

  return NextResponse.json({ ok: true, handled: 'ignored' }, { status: 200 })
}

async function handleCreditTopUpWebhook(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return

  const userId = session.metadata?.user_id
  const rawCredits = session.metadata?.credits_amount
  const credits = rawCredits ? parseInt(rawCredits, 10) : 0
  const rawGbp = session.metadata?.amount_gbp
  const amountGbp = rawGbp ? parseFloat(rawGbp) : (session.amount_total ?? 0) / 100
  const listingId = session.metadata?.listing_id ?? session.metadata?.pending_listing_id ?? null

  if (!userId || !Number.isFinite(credits) || credits <= 0 || !session.id) return

  try {
    await applyCreditTopupFromStripeSession({
      userId,
      stripeSessionId: session.id,
      creditsAmount: credits,
      amountGbp,
      listingId,
      returnPath: null,
    })
  } catch (err: unknown) {
    console.error('[webhook] credit_topup error:', err instanceof Error ? err.message : err)
  }
}

async function handleSubscriptionWebhook(session: Stripe.Checkout.Session) {
  const plan = session.metadata?.plan
  if (!plan) return

  try {
    const adminDb = getAdminDb()
    if (!adminDb) return

    const userId = session.metadata?.user_id
    const isPublicSignup = session.metadata?.is_public_signup === 'true'
    const email = session.customer_email

    if (userId) {
      await adminDb.from('profiles').update({
        plan: plan,
        subscription_plan: plan,
        subscription_status: 'active',
        stripe_customer_id: session.customer?.toString(),
        stripe_subscription_id: session.subscription?.toString(),
        updated_at: new Date().toISOString()
      }).eq('id', userId)
    } else if (isPublicSignup && email) {
      const { data: existingProfile } = await adminDb
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1)
        .maybeSingle()

      if (existingProfile) {
        await adminDb.from('profiles').update({
          plan,
          subscription_plan: plan,
          subscription_status: 'active',
          stripe_customer_id: session.customer?.toString(),
          stripe_subscription_id: session.subscription?.toString(),
          stripe_session_id: session.id,
          updated_at: new Date().toISOString(),
        }).eq('id', existingProfile.id)
      } else {
        const { data: profile } = await adminDb.from('profiles').insert({
        email: email,
        plan: plan,
        subscription_plan: plan,
        subscription_status: 'active',
        stripe_customer_id: session.customer?.toString(),
        stripe_subscription_id: session.subscription?.toString(),
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
        }).select('id').single()

        console.log(`[webhook] Created new profile for public signup: ${profile?.id ?? 'unknown'} (${email})`)
      }
    }
  } catch (err: unknown) {
    console.error('[webhook] subscription update error:', err instanceof Error ? err.message : 'unknown error')
  }
}

async function handleP2PTransferWebhook(session: Stripe.Checkout.Session) {
  const transferId = session.metadata?.transfer_id
  if (!transferId) return

  const paid = session.payment_status === 'paid'

  try {
    const adminDb = getAdminDb()
    if (!adminDb) return
    const { data: transfer, error: transferError } = await adminDb
      .from('p2p_transfers')
      .select(Q.p2pTransfer)
      .eq('id', transferId)
      .single()
    if (transferError || !transfer) return

    if (paid) {
      await adminDb.from('p2p_transfers').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent?.toString() ?? null,
      }).eq('id', transferId)

      const { data: profiles } = await adminDb
        .from('profiles')
        .select(Q.profile.webhook)
        .in('id', [transfer.sender_id, transfer.recipient_id])

      const sender = (profiles ?? []).find((p) => p.id === transfer.sender_id) as { id: string; username?: string; full_name?: string; total_score?: number; email?: string; espeezy_email?: string } | undefined
      const recipient = (profiles ?? []).find((p) => p.id === transfer.recipient_id) as { id: string; username?: string; full_name?: string; total_score?: number; email?: string; espeezy_email?: string } | undefined

      if (sender && recipient) {
        const impactScore = 15

        await adminDb.from('profiles').update({
          total_score: (sender.total_score || 0) + impactScore
        }).eq('id', transfer.sender_id)
        await adminDb.from('profiles').update({
          total_score: (recipient.total_score || 0) + impactScore
        }).eq('id', transfer.recipient_id)

        await adminDb.from('notifications').insert({
          user_id: transfer.sender_id,
          type: 'payment_sent',
          title: `Payment sent to @${recipient.username || 'scholar'}`,
          message: `You sent £${(transfer.amount_cents / 100).toFixed(2)} to ${recipient.full_name || recipient.username}.`,
          link: '/wallet',
          created_at: new Date().toISOString()
        })
        await adminDb.from('notifications').insert({
          user_id: transfer.recipient_id,
          type: 'payment_received',
          title: `Payment received from @${sender.username || 'scholar'}`,
          message: `You received £${(transfer.net_cents / 100).toFixed(2)} from ${sender.full_name || sender.username}.`,
          link: '/wallet',
          created_at: new Date().toISOString()
        })

        const recipientEmails = [recipient.email, recipient.espeezy_email].filter((value): value is string => Boolean(value))
        if (recipientEmails.length > 0) {
          void sendP2PTransactionEmail({
            to: recipientEmails,
            role: 'recipient',
            transferId: transfer.id,
            counterpartyName: sender.full_name || sender.username || 'scholar',
            counterpartyUsername: sender.username || 'scholar',
            amountCents: transfer.amount_cents,
            feeCents: transfer.fee_cents || 0,
            netCents: transfer.net_cents || transfer.amount_cents,
            note: transfer.note ?? null,
          }).catch((error) => {
            console.error('[webhook] P2P email error:', error)
          })
        }
      }
    } else {
      await adminDb.from('p2p_transfers').update({ status: 'failed', failed_at: new Date().toISOString() }).eq('id', transferId)
    }
  } catch (err: unknown) {
    console.error('[webhook] P2P transfer error:', err instanceof Error ? err.message : 'unknown error')
  }
}
