'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DEFAULT_CREDIT_FUND_GBP } from '@/lib/credits/fund-stripe-shared'
import { formatCredits } from '@/lib/credits'
import {
  CREDIT_FUND_TIERS,
  pickFundTierForShortfall,
  type CreditFundTier,
} from '@/lib/credits/fund-tiers'

type Props = {
  amountGbp?: number
  creditsNeeded?: number
  returnPath?: string
  listingId?: string
  contextLabel?: string
  label?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'link'
  oneClick?: boolean
}

export function FundCreditAccountButton({
  amountGbp: amountGbpProp,
  creditsNeeded,
  returnPath = '/account/credits',
  listingId,
  contextLabel,
  label = 'Add credits',
  className = '',
  oneClick = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)

  const recommendedTier = useMemo(() => {
    if (creditsNeeded != null && creditsNeeded > 0) {
      return pickFundTierForShortfall(creditsNeeded)
    }
    if (amountGbpProp != null) {
      return CREDIT_FUND_TIERS.find((t) => t.amountGbp === amountGbpProp) ?? CREDIT_FUND_TIERS[1]
    }
    return CREDIT_FUND_TIERS.find((t) => t.amountGbp === DEFAULT_CREDIT_FUND_GBP) ?? CREDIT_FUND_TIERS[1]
  }, [amountGbpProp, creditsNeeded])

  const activeTier: CreditFundTier =
    CREDIT_FUND_TIERS.find((t) => t.id === selectedTierId) ?? recommendedTier

  const startCheckout = async (tier: CreditFundTier) => {
    setLoading(true)
    try {
      const res = await fetch('/api/credits/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amountGbp: tier.amountGbp,
          returnPath,
          listingId,
          contextLabel: contextLabel ?? `Fund ${tier.label} tier`,
        }),
      })
      const data = (await res.json()) as { checkoutUrl?: string; error?: string }
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? 'Could not start payment')
      }
      window.location.href = data.checkoutUrl
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Payment could not start')
      setLoading(false)
    }
  }

  const handleCta = () => {
    void startCheckout(activeTier)
  }

  const selectionLine =
    creditsNeeded != null && creditsNeeded > 0
      ? `Suggested · £${recommendedTier.amountGbp} · ${formatCredits(recommendedTier.credits)}`
      : `£${activeTier.amountGbp} · ${formatCredits(activeTier.credits)}`

  return (
    <div className={`credit-fund-premium central-type${className ? ` ${className}` : ''}`}>
      {!oneClick && (
        <div className="credit-fund-premium__tiers" role="group" aria-label="Choose fund tier">
          {CREDIT_FUND_TIERS.map((tier) => {
            const selected = tier.id === activeTier.id
            return (
              <button
                key={tier.id}
                type="button"
                className={`credit-fund-premium__tier${selected ? ' credit-fund-premium__tier--active' : ''}`}
                disabled={loading}
                onClick={() => setSelectedTierId(tier.id)}
                aria-pressed={selected}
              >
                <span className="credit-fund-premium__tier-name">{tier.label}</span>
                <span className="credit-fund-premium__tier-price">£{tier.amountGbp}</span>
                <span className="credit-fund-premium__tier-credits">{formatCredits(tier.credits)}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="credit-fund-premium__footer">
        <p className="credit-fund-premium__selection">{selectionLine}</p>
        <button
          type="button"
          className="credit-fund-premium__cta"
          disabled={loading}
          onClick={handleCta}
          aria-label={`${label}, ${selectionLine}`}
        >
          {loading ? <Loader2 size={12} className="animate-spin" aria-hidden /> : null}
          {label}
        </button>
      </div>
    </div>
  )
}
