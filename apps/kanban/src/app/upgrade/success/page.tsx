import { redirect } from 'next/navigation'
import { getPlanKey } from '@/lib/stripe-payment-links'
import { marketingCheckoutSuccessUrl, type MarketingPlanKey } from '@/lib/marketing-urls'

type PageProps = {
  searchParams: Promise<{ plan?: string }>
}

export default async function UpgradeSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams
  const plan = getPlanKey(params.plan) as MarketingPlanKey
  redirect(marketingCheckoutSuccessUrl(plan))
}
