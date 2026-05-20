import { redirect } from 'next/navigation'
import { APP_PRICING_PATH } from '@/lib/pricing/plan-routes'

export default function UpgradePage() {
  redirect(APP_PRICING_PATH)
}
