import { redirect } from 'next/navigation'
import { marketingPricingUrl } from '@/lib/marketing-urls'

/** Subscription marketing lives on espeezy.com — redirect out of the Kanban app. */
export default function UpgradePage() {
  redirect(marketingPricingUrl())
}
