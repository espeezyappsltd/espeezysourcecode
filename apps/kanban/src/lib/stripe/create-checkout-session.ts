import type Stripe from 'stripe'
import { getAppUrl } from '@/utils/stripe'

export type CheckoutPlanKey = 'pro' | 'premium' | 'lifetime'

const PLAN_CONFIG: Record<
  CheckoutPlanKey,
  { priceEnvKey: string; mode: 'subscription' | 'payment'; label: string }
> = {
  pro: { priceEnvKey: 'STRIPE_PRICE_PRO_ID', mode: 'subscription', label: 'Pro Scholar - GBP 3.99/month' },
  premium: {
    priceEnvKey: 'STRIPE_PRICE_PREMIUM_ID',
    mode: 'subscription',
    label: 'Premium Scholar - GBP 10.49/month',
  },
  lifetime: { priceEnvKey: 'STRIPE_PRICE_LIFETIME_ID', mode: 'payment', label: 'Lifetime Scholar · GBP 149 (one-time)' },
}

export function getCheckoutPlanConfig(plan: CheckoutPlanKey) {
  const config = PLAN_CONFIG[plan]
  const priceId = process.env[config.priceEnvKey]
  if (!priceId) {
    throw new Error('Stripe is not configured correctly.')
  }
  return { ...config, priceId, plan }
}

type CreateCheckoutInput = {
  stripe: Stripe
  plan: CheckoutPlanKey
  userId: string
  email: string
  stripeCustomerId?: string | null
  request?: Request | null
}

export async function createCheckoutSessionForUser(input: CreateCheckoutInput): Promise<Stripe.Checkout.Session> {
  const { stripe, plan, userId, email, stripeCustomerId, request } = input
  const { priceId, mode, label } = getCheckoutPlanConfig(plan)
  const appOrigin = getAppUrl(request ?? null)

  const successUrl =
    process.env.STRIPE_SUCCESS_URL?.trim() ||
    `${appOrigin}/settings?tab=billing&checkout=success&plan=${plan}`
  const cancelUrl =
    process.env.STRIPE_CANCEL_URL?.trim() || `${appOrigin}/pricing?checkout=cancelled`

  const params: Stripe.Checkout.SessionCreateParams = {
    mode,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl.includes('{CHECKOUT_SESSION_ID}')
      ? successUrl
      : `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
    client_reference_id: userId,
    metadata: {
      user_id: userId,
      plan,
      product_label: label,
    },
  }

  if (stripeCustomerId) {
    params.customer = stripeCustomerId
  } else {
    params.customer_email = email
  }

  if (mode === 'subscription') {
    params.subscription_data = {
      metadata: { user_id: userId, plan },
    }
  }

  const session = await stripe.checkout.sessions.create(params)
  if (!session.url) {
    throw new Error('Unable to initialize Stripe checkout session.')
  }
  return session
}
