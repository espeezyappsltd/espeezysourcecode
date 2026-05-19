import { redirect } from 'next/navigation'
import { marketingPricingUrl } from '@/lib/marketing-urls'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function LegacyDonationIdPage({ params }: PageProps) {
  await params
  redirect(marketingPricingUrl())
}
