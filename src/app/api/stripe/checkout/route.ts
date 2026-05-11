import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequestUser } from '@/lib/supabase/admin'
import { getStripeClient } from '@/utils/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'premium', 'lifetime']).default('pro'),
})

const publicCheckoutSchema = z.object({
  plan: z.enum(['pro', 'premium', 'lifetime']).default('pro'),
  email: z.string().email().max(254),
  prefilled_promo_code: z.string().max(100).optional(),
})

const PLAN_CONFIG: Record<z.infer<typeof checkoutSchema>['plan'], { priceEnvKey: string; mode: 'subscription' | 'payment'; label: string }> = {
  pro: { priceEnvKey: 'STRIPE_PRICE_PRO_ID', mode: 'subscription', label: 'Pro Scholar - GBP 3.99/month' },
  premium: { priceEnvKey: 'STRIPE_PRICE_PREMIUM_ID', mode: 'subscription', label: 'Premium Scholar - GBP 10.49/month' },
  lifetime: { priceEnvKey: 'STRIPE_PRICE_LIFETIME_ID', mode: 'payment', label: 'Lifetime Founding Scholar - GBP 149' },
}

/**
 * POST /api/stripe/checkout
 * - Authenticated: requires Bearer token for logged-in users
 * - Public: accepts email for pre-registration signups
 */
export async function POST(req: Request) {
  let stripe
  try {
    stripe = getStripeClient()
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Stripe is not configured' }, { status: 500 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const body = await req.json().catch(() => null)

    if (!authHeader?.startsWith('Bearer ')) {
      return handlePublicCheckout(stripe, body)
    }

    return handleAuthenticatedCheckout(stripe, req, body)
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error.message)
    return NextResponse.json({ error: error.message || 'Stripe session creation failed.' }, { status: 500 })
  }
}

async function handleAuthenticatedCheckout(stripe: any, req: Request, body: any) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = user.id
  const email = user.email

  const parsedBody = checkoutSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 422 })
  }

  const planKey = parsedBody.data.plan
  const config = PLAN_CONFIG[planKey]

  const priceId = process.env[config.priceEnvKey]
  const successUrl = process.env.STRIPE_SUCCESS_URL
  const cancelUrl = process.env.STRIPE_CANCEL_URL

  if (!priceId || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: 'Stripe is not configured correctly.' }, { status: 500 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: config.mode,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
    metadata: {
      user_id: uid,
      plan: planKey,
      product_label: config.label,
    },
  })

  if (!session.url) {
    throw new Error('Unable to initialize Stripe checkout session.')
  }

  return NextResponse.json({ url: session.url })
}

/**
 * Public checkout for pre-registration signups (no Firebase auth required)
 * Creates a Stripe checkout session with email in metadata for webhook to create user
 */
async function handlePublicCheckout(stripe: any, body: any) {
  const parsed = publicCheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request. Required: plan, email' }, { status: 422 })
  }

  const { plan: planKey, email, prefilled_promo_code } = parsed.data
  const config = PLAN_CONFIG[planKey]
  const priceId = process.env[config.priceEnvKey]
  const successUrl = (process.env.STRIPE_PROMO_SUCCESS_URL ?? process.env.STRIPE_SUCCESS_URL)?.replace(/\/$/, '')
  const cancelUrl = (process.env.STRIPE_CANCEL_URL ?? 'https://espeezy.com/checkout')?.replace(/\/$/, '')

  if (!priceId || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: 'Stripe is not configured correctly.' }, { status: 500 })
  }

  const sessionParams: any = {
    mode: config.mode,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    success_url: `${successUrl}?plan=${planKey}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
    metadata: {
      plan: planKey,
      product_label: config.label,
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
