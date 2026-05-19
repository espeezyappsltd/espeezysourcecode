import { redirect } from 'next/navigation'
import { getPlanKey } from '@/lib/stripe-payment-links'
import { marketingCheckoutUrl, type MarketingPlanKey } from '@/lib/marketing-urls'

type PageProps = {
  searchParams: Promise<{ plan?: string; coupon?: string }>
}

/** Checkout UI is on the marketing site — forward plan (and coupon) query params. */
export default async function CheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams
  const plan = getPlanKey(params.plan) as MarketingPlanKey
  redirect(
    marketingCheckoutUrl(plan, {
      coupon: params.coupon,
    }),
  )
}
