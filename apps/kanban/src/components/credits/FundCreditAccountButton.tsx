'use client'

import { useMemo, useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import { DEFAULT_CREDIT_FUND_GBP, gbpToCredits } from '@/lib/credits/fund-stripe-shared'
import { formatCredits } from '@/lib/credits'
import {
  CREDIT_FUND_TIERS,
  pickFundTierForShortfall,
  tierSummary,
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
  /** When false, show tier picker so users can switch fund tier before checkout. */
  oneClick?: boolean
}

export function FundCreditAccountButton({
  amountGbp: amountGbpProp,
  creditsNeeded,
  returnPath = '/account/credits',
  listingId,
  contextLabel,
  label = 'Fund cred acc now',
  className = '',
  variant = 'primary',
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

  const handlePrimaryClick = () => {
    if (oneClick) {
      void startCheckout(activeTier)
      return
    }
    void startCheckout(activeTier)
  }

  const btnClass =
    variant === 'link'
      ? `credit-fund-btn credit-fund-btn--link${className ? ` ${className}` : ''}`
      : variant === 'secondary'
        ? `btn btn-secondary credit-fund-btn${className ? ` ${className}` : ''}`
        : `btn btn-primary credit-fund-btn${className ? ` ${className}` : ''}`

  return (
    <div className="credit-fund-wrap">
      <div className="credit-fund-tier-switch" role="group" aria-label="Choose fund tier">
        {CREDIT_FUND_TIERS.map((tier) => {
          const selected = tier.id === activeTier.id
          return (
            <button
              key={tier.id}
              type="button"
              className={`credit-fund-tier${selected ? ' credit-fund-tier--active' : ''}`}
              disabled={loading}
              onClick={() => setSelectedTierId(tier.id)}
              aria-pressed={selected}
            >
              <span className="credit-fund-tier__label">{tier.label}</span>
              <span className="credit-fund-tier__meta">
                £{tier.amountGbp} · {formatCredits(tier.credits)}
              </span>
            </button>
          )
        })}
      </div>
      <p className="credit-fund-picker__hint" style={{ margin: '0.5rem 0 0', fontSize: '0.78rem' }}>
        {creditsNeeded != null && creditsNeeded > 0
          ? `Recommended for your shortfall: ${tierSummary(recommendedTier)}`
          : `Selected: ${tierSummary(activeTier)}`}
      </p>
      <button
        type="button"
        className={btnClass}
        disabled={loading}
        onClick={handlePrimaryClick}
        aria-label={`${label}, ${tierSummary(activeTier)}`}
        style={{ marginTop: '0.65rem' }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Wallet size={16} aria-hidden />}
        {label}
      </button>
    </div>
  )
}
