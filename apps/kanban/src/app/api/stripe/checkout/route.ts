import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { z } from 'zod'
import { getRequestUser } from '@/lib/supabase/admin'
import {
  createCheckoutSessionForUser,
  getCheckoutPlanConfig,
  type CheckoutPlanKey,
} from '@/lib/stripe/create-checkout-session'
import { getStripeClient } from '@/utils/stripe'
import { getAdminDb } from '@/lib/supabase/admin'
import { resolveReferralProDiscount } from '@/lib/referrals/referral-pro'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'premium', 'lifetime']).default('pro'),
  referral_code: z.string().trim().max(8).optional(),
})

const publicCheckoutSchema = z.object({
  plan: z.enum(['pro', 'premium', 'lifetime']).default('pro'),
  email: z.string().email().max(254),
  prefilled_promo_code: z.string().max(100).optional(),
})

const PLAN_LABELS: Record<CheckoutPlanKey, string> = {
  pro: 'Pro Scholar - GBP 3.99/month',
  premium: 'Premium Scholar - GBP 10.49/month',
  lifetime: 'Lifetime Scholar · GBP 149 (one-time)',
}

/**
 * POST /api/stripe/checkout
 * - Authenticated: Stripe Checkout for the signed-in user (metadata user_id)
 * - Public: email-based checkout for marketing signups
 */
export async function POST(req: Request) {
  let stripe: Stripe
  try {
    stripe = getStripeClient()
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Stripe is not configured' }, { status: 500 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const body = await req.json().catch(() => null)

    if (!authHeader?.startsWith('Bearer ')) {
      return handlePublicCheckout(stripe, body)
    }

    return handleAuthenticatedCheckout(stripe, req, body)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe session creation failed.'
    console.error('Stripe Checkout Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function handleAuthenticatedCheckout(stripe: Stripe, req: Request, body: unknown) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsedBody = checkoutSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 422 })
  }

  const planKey = parsedBody.data.plan
  const adminDb = getAdminDb()
  let stripeCustomerId: string | null = null

  if (adminDb) {
    const { data: profile } = await adminDb
      .from('profiles')
      .select('stripe_customer_id, subscription_plan, stripe_subscription_id')
      .eq('id', user.id)
      .maybeSingle()

    stripeCustomerId = profile?.stripe_customer_id ?? null

    if (
      profile?.stripe_subscription_id &&
      profile.subscription_plan &&
      profile.subscription_plan !== 'free' &&
      profile.subscription_plan !== 'lifetime' &&
      planKey !== 'lifetime'
    ) {
      return NextResponse.json(
        {
          error:
            'You already have an active subscription. Use Manage billing in Settings to change or cancel your plan.',
          portal: true,
        },
        { status: 409 },
      )
    }
  }

  let referral:
    | { couponId: string; referrerProfileId: string; referralCode: string }
    | null = null

  if (parsedBody.data.referral_code && adminDb) {
    const discount = await resolveReferralProDiscount(adminDb, {
      buyerUserId: user.id,
      referralCode: parsedBody.data.referral_code,
      plan: planKey,
    })
    if (!discount.valid) {
      return NextResponse.json({ error: discount.reason }, { status: 422 })
    }
    referral = {
      couponId: discount.couponId,
      referrerProfileId: discount.referrerProfileId,
      referralCode: discount.normalizedCode,
    }
  }

  const session = await createCheckoutSessionForUser({
    stripe,
    plan: planKey,
    userId: user.id,
    email: user.email ?? '',
    stripeCustomerId,
    request: req,
    referral,
  })

  return NextResponse.json({
    url: session.url,
    referral_applied: Boolean(referral),
  })
}

async function handlePublicCheckout(stripe: Stripe, body: unknown) {
  const parsed = publicCheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request. Required: plan, email' }, { status: 422 })
  }

  const { plan: planKey, email, prefilled_promo_code } = parsed.data
  const { priceId, mode } = getCheckoutPlanConfig(planKey)
  const successUrl = (process.env.STRIPE_PROMO_SUCCESS_URL ?? process.env.STRIPE_SUCCESS_URL)?.replace(/\/$/, '')
  const cancelUrl = (process.env.STRIPE_CANCEL_URL ?? 'https://espeezy.com/checkout')?.replace(/\/$/, '')

  if (!successUrl || !cancelUrl) {
    return NextResponse.json({ error: 'Stripe is not configured correctly.' }, { status: 500 })
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    success_url: `${successUrl}?plan=${planKey}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
    metadata: {
      plan: planKey,
      product_label: PLAN_LABELS[planKey],
      is_public_signup: 'true',
    },
  }

  if (prefilled_promo_code) {
    sessionParams.discounts = [{ coupon: prefilled_promo_code }]
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) {
    throw new Error('Unable to initialize Stripe checkout session.')
  }

  return NextResponse.json({ url: session.url, session_id: session.id })
}
