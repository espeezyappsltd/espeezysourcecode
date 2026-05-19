import { redirect } from 'next/navigation'
import { marketingPricingUrl } from '@shared/marketing-urls'

/** Plans and checkout UI live on the marketing site (espeezy.com). */
export default function UpgradePage() {
  redirect(marketingPricingUrl())
}
