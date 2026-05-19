import type { MarketingPlanKey } from '@/lib/marketing-urls'

/** @deprecated Use marketing checkout on espeezy.com — kept for plan query parsing only. */
export type PlanKey = MarketingPlanKey

export function getPlanKey(value: string | null | undefined): PlanKey {
  if (value === 'premium' || value === 'lifetime') {
    return value
  }
  return 'pro'
}
