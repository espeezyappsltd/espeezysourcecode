import Stripe from 'stripe'
import { NextResponse } from 'next/server'
// import { paymentWorkflow, type PaymentWorkflowPayload } from '@/workflows/paymentWorkflow'
import { getAdminDb } from '@/lib/firebase-admin'
import { sendP2PTransactionEmail } from '@/services/email'
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Stripe not configured' }, { status: 500 })
  }

  const rawBody = Buffer.from(await req.arrayBuffer())

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error: any) {
    return NextResponse.json({ error: `Stripe webhook verification failed: ${error.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.type === 'donation') {
      await handleDonationWebhook(session)
      return NextResponse.json({ ok: true, handled: 'donation' }, { status: 200 })
    }
    if (session.metadata?.type === 'p2p_transfer') {
      await handleP2PTransferWebhook(session)
      return NextResponse.json({ ok: true, handled: 'p2p_transfer' }, { status: 200 })
    }
    
    // Standard subscription/payment
    await handleSubscriptionWebhook(session)
    return NextResponse.json({ ok: true, handled: 'subscription' }, { status: 200 })
  }

  return NextResponse.json({ ok: true, handled: 'ignored' }, { status: 200 })
}

async function handleSubscriptionWebhook(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const plan = session.metadata?.plan
  if (!userId || !plan) return

  try {
    const adminDb = getAdminDb()
    if (!adminDb) return
    await adminDb.collection('profiles').doc(userId).update({
      plan: plan,
      stripe_customer_id: session.customer?.toString(),
      stripe_subscription_id: session.subscription?.toString(),
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    console.error('[webhook] subscription update error:', err)
  }
}

async function handleDonationWebhook(session: Stripe.Checkout.Session) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return
    const meta = session.metadata ?? {}
    await adminDb.collection('donations').doc(session.id).set({
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent?.toString() ?? null,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      donor_email: meta.is_anonymous === 'true' ? null : (meta.donor_email || session.customer_email || null),
      donor_name: meta.is_anonymous === 'true' ? null : (meta.donor_name || null),
      message: meta.message || null,
      feature_tag: meta.feature_tag || 'general',
      is_anonymous: meta.is_anonymous === 'true',
      status: session.payment_status === 'paid' ? 'completed' : 'pending',
      completed_at: session.payment_status === 'paid' ? new Date().toISOString() : null,
      metadata: meta,
    })
  } catch (err) {
    console.error('[webhook] donation upsert error:', err)
  }
}

async function handleP2PTransferWebhook(session: Stripe.Checkout.Session) {
  const transferId = session.metadata?.transfer_id
  if (!transferId) return

  const paid = session.payment_status === 'paid'

  try {
    const adminDb = getAdminDb()
    if (!adminDb) return
    const transferRef = adminDb.collection('p2p_transfers').doc(transferId)
    const transferSnap = await transferRef.get()
    if (!transferSnap.exists) return
    const transfer = transferSnap.data()!

    if (paid) {
      await transferRef.update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent?.toString() ?? null,
      })

      const senderSnap = await adminDb.collection('profiles').doc(transfer.sender_id).get()
      const recipientSnap = await adminDb.collection('profiles').doc(transfer.recipient_id).get()

      if (senderSnap.exists && recipientSnap.exists) {
        const sender = senderSnap.data()!
        const recipient = recipientSnap.data()!
        const impactScore = 15

        // Update scores
        await adminDb.collection('profiles').doc(transfer.sender_id).update({
          total_score: (sender.total_score || 0) + impactScore
        })
        await adminDb.collection('profiles').doc(transfer.recipient_id).update({
          total_score: (recipient.total_score || 0) + impactScore
        })

        // Notifications
        await adminDb.collection('notifications').add({
          user_id: transfer.sender_id,
          type: 'payment_sent',
          title: `Payment sent to @${recipient.username || 'scholar'}`,
          message: `You sent £${(transfer.amount_cents / 100).toFixed(2)} to ${recipient.full_name || recipient.username}.`,
          link: '/dashboard/wallet',
          created_at: new Date().toISOString()
        })
        await adminDb.collection('notifications').add({
          user_id: transfer.recipient_id,
          type: 'payment_received',
          title: `Payment received from @${sender.username || 'scholar'}`,
          message: `You received £${(transfer.net_cents / 100).toFixed(2)} from ${sender.full_name || sender.username}.`,
          link: '/dashboard/wallet',
          created_at: new Date().toISOString()
        })
      }
    } else {
      await transferRef.update({ status: 'failed', failed_at: new Date().toISOString() })
    }
  } catch (err) {
    console.error('[webhook] P2P transfer error:', err)
  }
}
