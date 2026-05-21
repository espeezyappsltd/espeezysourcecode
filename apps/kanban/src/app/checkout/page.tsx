import { redirect } from 'next/navigation'
import { getPlanKey } from '@/lib/stripe-payment-links'
import { marketingCheckoutUrl, type MarketingPlanKey } from '@/lib/marketing-urls'
import { createServerSupabaseClient } from '@/lib/db'
import { getStripeClient } from '@/utils/stripe'
import { createCheckoutSessionForUser } from '@/lib/stripe/create-checkout-session'
import { getAdminDb } from '@/lib/supabase/admin'
import { resolveReferralProDiscount } from '@/lib/referrals/referral-pro'
import { isValidReferralCode, normalizeReferralCode } from '@shared/referrals'

type PageProps = {
  searchParams: Promise<{ plan?: string; coupon?: string; ref?: string }>
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

  let referral: { couponId: string; referrerProfileId: string; referralCode: string } | null = null
  const refParam = params.ref?.trim()
  if (refParam && isValidReferralCode(refParam) && plan === 'pro') {
    const adminDb = getAdminDb()
    if (adminDb) {
      const discount = await resolveReferralProDiscount(adminDb, {
        buyerUserId: user.id,
        referralCode: normalizeReferralCode(refParam),
        plan: 'pro',
      })
      if (discount.valid) {
        referral = {
          couponId: discount.couponId,
          referrerProfileId: discount.referrerProfileId,
          referralCode: discount.normalizedCode,
        }
      }
    }
  }

  try {
    const stripe = getStripeClient()
    const session = await createCheckoutSessionForUser({
      stripe,
      plan,
      userId: user.id,
      email: user.email,
      stripeCustomerId: profile?.stripe_customer_id ?? null,
      referral,
    })
    if (session.url) {
      redirect(session.url)
    }
  } catch (err: unknown) {
    console.error('[checkout] session error:', err instanceof Error ? err.message : err)
  }

  redirect(`/pricing?checkout=error&plan=${plan}`)
}
