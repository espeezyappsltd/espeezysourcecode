import { redirect } from 'next/navigation'
import { getPlanKey } from '@/lib/stripe-payment-links'
import { marketingCheckoutUrl, type MarketingPlanKey } from '@/lib/marketing-urls'
import { createServerSupabaseClient } from '@/lib/db'
import { getStripeClient } from '@/utils/stripe'
import { createCheckoutSessionForUser } from '@/lib/stripe/create-checkout-session'

type PageProps = {
  searchParams: Promise<{ plan?: string; coupon?: string }>
}

/** Logged-in users: Stripe Checkout in-app. Guests: marketing checkout. */
export default async function CheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams
  const plan = getPlanKey(params.plan) as MarketingPlanKey

  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user?.id || !user.email) {
    redirect(
      marketingCheckoutUrl(plan, {
        coupon: params.coupon,
      }),
    )
  }

  const { data: profile } = await db
    .from('profiles')
    .select('stripe_customer_id, subscription_plan, stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  if (
    profile?.stripe_subscription_id &&
    profile.subscription_plan &&
    profile.subscription_plan !== 'free' &&
    profile.subscription_plan !== 'lifetime' &&
    plan !== 'lifetime'
  ) {
    redirect('/settings?tab=billing&billing=portal')
  }

  try {
    const stripe = getStripeClient()
    const session = await createCheckoutSessionForUser({
      stripe,
      plan,
      userId: user.id,
      email: user.email,
      stripeCustomerId: profile?.stripe_customer_id ?? null,
    })
    if (session.url) {
      redirect(session.url)
    }
  } catch (err: unknown) {
    console.error('[checkout] session error:', err instanceof Error ? err.message : err)
  }

  redirect(`/pricing?checkout=error&plan=${plan}`)
}
