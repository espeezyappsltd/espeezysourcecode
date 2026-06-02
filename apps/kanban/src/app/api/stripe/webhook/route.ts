import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import {
  downgradeProfileAfterSubscriptionEnded,
  syncProfileFromSubscription,
} from '@/lib/stripe/subscription-sync'
import { getStripeClient, getStripeWebhookSecret } from '@/utils/stripe'
import { recordReferralProRedemption } from '@/lib/referrals/referral-pro'

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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleSubscriptionWebhook(session)
        return NextResponse.json({ ok: true, handled: 'subscription' }, { status: 200 })
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await syncProfileFromSubscription(adminDb, subscription)
        return NextResponse.json({ ok: true, handled: 'subscription_updated' }, { status: 200 })
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await downgradeProfileAfterSubscriptionEnded(adminDb, subscription)
        return NextResponse.json({ ok: true, handled: 'subscription_deleted' }, { status: 200 })
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoiceWebhook(adminDb, invoice, event.type)
        return NextResponse.json({ ok: true, handled: event.type }, { status: 200 })
      }

      default:
        return NextResponse.json({ ok: true, handled: 'ignored' }, { status: 200 })
    }
  } catch (err: unknown) {
    console.error('[webhook] handler error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = invoice as Stripe.Invoice & { subscription?: string | { id: string } | null }
  const sub = legacy.subscription
  if (typeof sub === 'string') return sub
  if (sub && typeof sub === 'object' && 'id' in sub) return sub.id
  const fromParent = invoice.parent?.subscription_details?.subscription
  if (typeof fromParent === 'string') return fromParent
  return null
}

async function handleInvoiceWebhook(
  adminDb: NonNullable<ReturnType<typeof getAdminDb>>,
  invoice: Stripe.Invoice,
  eventType: 'invoice.payment_succeeded' | 'invoice.payment_failed',
) {
  const subId = invoiceSubscriptionId(invoice)
  if (!subId) return

  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const { data: profile } = await adminDb
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .limit(1)
    .maybeSingle()

  if (!profile?.id) return

  if (eventType === 'invoice.payment_succeeded') {
    await adminDb
      .from('profiles')
      .update({ subscription_status: 'active', updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    return
  }

  await adminDb
    .from('profiles')
    .update({ subscription_status: 'past_due', updated_at: new Date().toISOString() })
    .eq('id', profile.id)
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
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.toString()
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.toString()

    const tier =
      plan === 'premium' || plan === 'lifetime' ? 'premium' : plan === 'pro' ? 'pro' : 'free'

    const patch = {
      plan,
      tier,
      subscription_plan: plan,
      subscription_status: 'active' as const,
      stripe_customer_id: customerId ?? undefined,
      stripe_subscription_id: subscriptionId ?? undefined,
      subscription_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (userId) {
      await adminDb.from('profiles').update(patch).eq('id', userId)

      const referrerId = session.metadata?.referrer_profile_id
      if (plan === 'pro' && referrerId && session.payment_status === 'paid' && session.id) {
        await recordReferralProRedemption(adminDb, referrerId, userId, session.id)
      }
    } else if (isPublicSignup && email) {
      const { data: existingProfile } = await adminDb
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1)
        .maybeSingle()

      if (existingProfile) {
        await adminDb
          .from('profiles')
          .update({ ...patch, stripe_session_id: session.id })
          .eq('id', existingProfile.id)
      } else {
        const { data: profile } = await adminDb
          .from('profiles')
          .insert({
            email,
            ...patch,
            stripe_session_id: session.id,
          })
          .select('id')
          .single()

        console.log(`[webhook] Created new profile for public signup: ${profile?.id ?? 'unknown'} (${email})`)
      }
    }
  } catch (err: unknown) {
    console.error('[webhook] subscription update error:', err instanceof Error ? err.message : 'unknown error')
  }
}
