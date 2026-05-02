import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { getAppUrl, getStripeClient } from '../utils/stripe'

const APP_URL = getAppUrl()
const SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || `${APP_URL}/dashboard/payment-success`
const CANCEL_URL = process.env.STRIPE_CANCEL_URL || `${APP_URL}/dashboard/marketplace`

/**
 * Retrieve an existing Stripe Customer for the user or create one.
 * Persists stripe_customer_id back to the profiles table.
 */
export async function getOrCreateStripeCustomer({
  userId,
  email,
  name,
}: {
  userId: string
  email?: string
  name?: string
}): Promise<string> {
  const stripe = getStripeClient()
  const svc = await createAdminClient()
  const { data: profile } = await svc
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id as string
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { platform_user_id: userId },
  })

  await svc
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

/**
 * Portable Financial Service
 * Designed to be set-and-forget for multi-frontend reuse.
 */
export async function createCheckoutSession({
  userId,
  email,
  price,
  type,
  metadata = {},
}: {
  userId: string
  email: string | undefined
  price: number
  type: 'subscription' | 'purchase'
  metadata?: Record<string, string>
}) {
  const stripe = getStripeClient()
  const isSubscription = type === 'subscription'
  const amountToCharge = Math.round(price * 100) // Stripe uses cents

  const customerId = email
    ? await getOrCreateStripeCustomer({ userId, email })
    : undefined

  const session = await stripe.checkout.sessions.create({
    // Dynamic payment methods — Stripe auto-selects based on customer locale/wallet
    mode: isSubscription ? 'subscription' : 'payment',
    customer: customerId,
    customer_email: customerId ? undefined : email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: metadata.product_name || 'Espeezy Flux Provision',
            description: metadata.description || 'Academic Resource Exchange',
          },
          unit_amount: amountToCharge,
          ...(isSubscription && { recurring: { interval: 'month' } }),
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: userId,
      type,
      ...metadata,
    },
    success_url: `${SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: CANCEL_URL,
  })

  return session
}
