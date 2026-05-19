'use client'

import { useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import {
  DEFAULT_CREDIT_FUND_GBP,
  MIN_CREDIT_FUND_GBP,
  creditsToFundGbp,
  gbpToCredits,
} from '@/lib/credits/fund-stripe'
import { formatCredits, formatGbpApprox } from '@/lib/credits'

type Props = {
  /** Cash to charge (min £2). If omitted, uses default £5 or creditsNeeded conversion. */
  amountGbp?: number
  /** Target credits — converts to GBP (min £2). */
  creditsNeeded?: number
  returnPath?: string
  listingId?: string
  contextLabel?: string
  label?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'link'
  /** Skip amount picker — go straight to Stripe */
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
  oneClick = true,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [customGbp, setCustomGbp] = useState(String(amountGbpProp ?? DEFAULT_CREDIT_FUND_GBP))

  const resolvedGbp =
    amountGbpProp ??
    (creditsNeeded != null && creditsNeeded > 0 ? creditsToFundGbp(creditsNeeded) : DEFAULT_CREDIT_FUND_GBP)

  const previewCredits = gbpToCredits(resolvedGbp)

  const startCheckout = async (gbp: number) => {
    setLoading(true)
    try {
      const res = await fetch('/api/credits/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amountGbp: gbp,
          returnPath,
          listingId,
          contextLabel,
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

  const handleClick = () => {
    if (oneClick && !showPicker) {
      void startCheckout(resolvedGbp)
      return
    }
    setShowPicker((v) => !v)
  }

  const btnClass =
    variant === 'link'
      ? `credit-fund-btn credit-fund-btn--link${className ? ` ${className}` : ''}`
      : variant === 'secondary'
        ? `btn btn-secondary credit-fund-btn${className ? ` ${className}` : ''}`
        : `btn btn-primary credit-fund-btn${className ? ` ${className}` : ''}`

  return (
    <div className="credit-fund-wrap">
      <button
        type="button"
        className={btnClass}
        disabled={loading}
        onClick={handleClick}
        aria-label={`${label}, adds about ${formatCredits(previewCredits)}`}
      >
        {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Wallet size={16} aria-hidden />}
        {label}
      </button>

      {showPicker && !oneClick ? (
        <div className="credit-fund-picker">
          <p className="credit-fund-picker__hint">
            Min £{MIN_CREDIT_FUND_GBP} · ≈ {formatCredits(gbpToCredits(Number(customGbp) || MIN_CREDIT_FUND_GBP))} (
            {formatGbpApprox(gbpToCredits(Number(customGbp) || MIN_CREDIT_FUND_GBP))})
          </p>
          <div className="credit-fund-picker__row">
            <label htmlFor="fund-gbp-amount" className="sr-only">
              Amount in pounds
            </label>
            <span className="credit-fund-picker__currency">£</span>
            <input
              id="fund-gbp-amount"
              type="number"
              min={MIN_CREDIT_FUND_GBP}
              step={0.5}
              value={customGbp}
              onChange={(e) => setCustomGbp(e.target.value)}
              className="form-input credit-fund-picker__input"
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={loading}
              onClick={() => void startCheckout(Number(customGbp) || MIN_CREDIT_FUND_GBP)}
            >
              Pay
            </button>
          </div>
          <div className="credit-fund-picker__presets">
            {[2, 5, 10, 20].map((amt) => (
              <button
                key={amt}
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={loading}
                onClick={() => void startCheckout(amt)}
              >
                £{amt}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
