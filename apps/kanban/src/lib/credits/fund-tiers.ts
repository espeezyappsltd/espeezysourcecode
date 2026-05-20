import { gbpToCredits, MIN_CREDIT_FUND_GBP } from '@/lib/credits/fund-stripe-shared'
import { formatCredits } from '@/lib/credits'

export type CreditFundTier = {
  id: string
  amountGbp: number
  label: string
  description: string
  credits: number
}

export const CREDIT_FUND_TIERS: CreditFundTier[] = [
  {
    id: 'starter',
    amountGbp: 2,
    label: 'Starter',
    description: 'Quick top-up',
    credits: gbpToCredits(2),
  },
  {
    id: 'standard',
    amountGbp: 5,
    label: 'Standard',
    description: 'Most popular',
    credits: gbpToCredits(5),
  },
  {
    id: 'plus',
    amountGbp: 10,
    label: 'Plus',
    description: 'Bigger listings',
    credits: gbpToCredits(10),
  },
  {
    id: 'max',
    amountGbp: 20,
    label: 'Max',
    description: 'Campus power user',
    credits: gbpToCredits(20),
  },
]

export function pickFundTierForShortfall(shortfallCredits: number): CreditFundTier {
  const neededGbp = Math.max(MIN_CREDIT_FUND_GBP, shortfallCredits / 10)
  const sorted = [...CREDIT_FUND_TIERS].sort((a, b) => a.amountGbp - b.amountGbp)
  return sorted.find((t) => t.amountGbp >= neededGbp) ?? sorted[sorted.length - 1]
}

export function tierSummary(tier: CreditFundTier): string {
  return `${tier.label} · £${tier.amountGbp.toFixed(2)} · ${formatCredits(tier.credits)}`
}
