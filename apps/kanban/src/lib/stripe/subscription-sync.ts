import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

export type SubscriptionPlanKey = 'free' | 'pro' | 'premium' | 'lifetime'

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

function planFromPriceId(priceId: string | undefined): SubscriptionPlanKey | null {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_PRICE_PRO_ID) return 'pro'
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_ID) return 'premium'
  if (priceId === process.env.STRIPE_PRICE_LIFETIME_ID) return 'lifetime'
  return null
}

export function planFromSubscription(subscription: Stripe.Subscription): SubscriptionPlanKey | null {
  const metaPlan = subscription.metadata?.plan?.toLowerCase()
  if (metaPlan === 'pro' || metaPlan === 'premium' || metaPlan === 'lifetime') {
    return metaPlan
  }
  const priceId = subscription.items.data[0]?.price?.id
  return planFromPriceId(priceId)
}

export async function findProfileIdByStripeCustomer(
  adminDb: SupabaseClient,
  customerId: string,
): Promise<string | null> {
  const { data } = await adminDb
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

export async function syncProfileFromSubscription(
  adminDb: SupabaseClient,
  subscription: Stripe.Subscription,
  userId?: string | null,
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id

  let profileId = userId ?? null
  if (!profileId && customerId) {
    profileId = await findProfileIdByStripeCustomer(adminDb, customerId)
  }
  if (!profileId) return

  const status = subscription.status
  const cancelAtPeriodEnd = subscription.cancel_at_period_end === true
  const plan = planFromSubscription(subscription)

  if (ACTIVE_STATUSES.has(status)) {
    const activePlan = plan ?? 'pro'
    const tier =
      activePlan === 'premium' || activePlan === 'lifetime'
        ? 'premium'
        : activePlan === 'pro'
          ? 'pro'
          : 'free'
    await adminDb
      .from('profiles')
      .update({
        plan: activePlan,
        tier,
        subscription_plan: activePlan,
        subscription_status: cancelAtPeriodEnd ? 'canceling' : status,
        stripe_customer_id: customerId ?? undefined,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
    return
  }

  if (status === 'past_due' || status === 'unpaid') {
    await adminDb
      .from('profiles')
      .update({
        subscription_status: status,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
    return
  }

  if (status === 'canceled' || status === 'incomplete_expired') {
    await adminDb
      .from('profiles')
      .update({
        plan: 'free',
        tier: 'free',
        subscription_plan: 'free',
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
  }
}

export async function downgradeProfileAfterSubscriptionEnded(
  adminDb: SupabaseClient,
  subscription: Stripe.Subscription,
  userId?: string | null,
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id

  let profileId = userId ?? null
  if (!profileId && customerId) {
    profileId = await findProfileIdByStripeCustomer(adminDb, customerId)
  }
  if (!profileId) return

  await adminDb
    .from('profiles')
    .update({
      plan: 'free',
      tier: 'free',
      subscription_plan: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
}
