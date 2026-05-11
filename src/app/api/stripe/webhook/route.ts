import Stripe from 'stripe'
import { NextResponse } from 'next/server'
// import { paymentWorkflow, type PaymentWorkflowPayload } from '@/workflows/paymentWorkflow'
import { getAdminDb } from '@/lib/supabase/admin'
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
    const isDonationLike =
      session.metadata?.type === 'donation'
      || (session.mode === 'payment' && !session.subscription && session.metadata?.type !== 'p2p_transfer')

    if (isDonationLike) {
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

function getSupabaseConfig() {
  const url = (process.env.PROJECT_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return { url, key }
}

async function upsertDonationToSupabase(session: Stripe.Checkout.Session) {
  const cfg = getSupabaseConfig()
  if (!cfg) return

  const meta = session.metadata ?? {}
  const basePayload = {
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent?.toString() ?? null,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? 'gbp',
    donor_email: meta.is_anonymous === 'true' ? null : (meta.donor_email || session.customer_email || null),
    donor_name: meta.is_anonymous === 'true' ? null : (meta.donor_name || null),
    message: meta.message || null,
    feature_tag: meta.feature_tag || 'general',
    is_anonymous: meta.is_anonymous === 'true',
    status: session.payment_status === 'paid' ? 'completed' : 'pending',
    completed_at: session.payment_status === 'paid' ? new Date().toISOString() : null,
    metadata: meta,
    updated_at: new Date().toISOString(),
  }

  const richInsert = await fetch(`${cfg.url}/rest/v1/donations`, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(basePayload),
  })

  if (richInsert.ok) return

  // Fallback insert for minimal schemas.
  await fetch(`${cfg.url}/rest/v1/donations`, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      stripe_session_id: session.id,
      amount_cents: session.amount_total ?? 0,
      status: session.payment_status === 'paid' ? 'completed' : 'pending',
    }),
  })
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
          stripe_customer_id: session.customer?.toString(),
          stripe_subscription_id: session.subscription?.toString(),
          stripe_session_id: session.id,
          updated_at: new Date().toISOString(),
        }).eq('id', existingProfile.id)
      } else {
        const { data: profile } = await adminDb.from('profiles').insert({
        email: email,
        plan: plan,
        stripe_customer_id: session.customer?.toString(),
        stripe_subscription_id: session.subscription?.toString(),
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
        }).select('id').single()

        console.log(`[webhook] Created new profile for public signup: ${profile?.id ?? 'unknown'} (${email})`)
      }
    }
  } catch (err) {
    console.error('[webhook] subscription update error:', err)
  }
}

async function handleDonationWebhook(session: Stripe.Checkout.Session) {
  try {
    const adminDb = getAdminDb()
    const meta = session.metadata ?? {}
    if (adminDb) {
      await adminDb.from('donations').upsert({
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent?.toString() ?? null,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? 'gbp',
        donor_email: meta.is_anonymous === 'true' ? null : (meta.donor_email || session.customer_email || null),
        donor_name: meta.is_anonymous === 'true' ? null : (meta.donor_name || null),
        message: meta.message || null,
        feature_tag: meta.feature_tag || 'general',
        is_anonymous: meta.is_anonymous === 'true',
        status: session.payment_status === 'paid' ? 'completed' : 'pending',
        completed_at: session.payment_status === 'paid' ? new Date().toISOString() : null,
        metadata: meta,
      }, { onConflict: 'stripe_session_id' })
    }

    await upsertDonationToSupabase(session)
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
    const { data: transfer, error: transferError } = await adminDb
      .from('p2p_transfers')
      .select('*')
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
        .select('*')
        .in('id', [transfer.sender_id, transfer.recipient_id])

      const sender = (profiles ?? []).find((profile: any) => profile.id === transfer.sender_id)
      const recipient = (profiles ?? []).find((profile: any) => profile.id === transfer.recipient_id)

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
          link: '/dashboard/wallet',
          created_at: new Date().toISOString()
        })
        await adminDb.from('notifications').insert({
          user_id: transfer.recipient_id,
          type: 'payment_received',
          title: `Payment received from @${sender.username || 'scholar'}`,
          message: `You received £${(transfer.net_cents / 100).toFixed(2)} from ${sender.full_name || sender.username}.`,
          link: '/dashboard/wallet',
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
  } catch (err) {
    console.error('[webhook] P2P transfer error:', err)
  }
}
