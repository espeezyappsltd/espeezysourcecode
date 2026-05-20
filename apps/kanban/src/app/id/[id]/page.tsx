import { redirect } from 'next/navigation'
import { APP_PRICING_PATH } from '@/lib/pricing/plan-routes'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function LegacyDonationIdPage({ params }: PageProps) {
  await params
  redirect(APP_PRICING_PATH)
}
