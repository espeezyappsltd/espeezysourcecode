'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, Gift, Users } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import {
  REFERRAL_PRO_DISCOUNT_PERCENT,
  REFERRAL_PRO_MAX_REDEMPTIONS,
  REFERRAL_PROMO_TERMS,
} from '@shared/referrals'
import { useNotifications } from '@/components/NotificationProvider'

type ReferralMe = {
  referral_code: string
  redemptions_used: number
  redemptions_remaining: number
  max_redemptions: number
  share_url: string
  terms: string
}

export function ReferralProgramPanel({ compact = false }: { compact?: boolean }) {
  const { addToast } = useNotifications()
  const [data, setData] = useState<ReferralMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [friendCode, setFriendCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [friendValid, setFriendValid] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    const supabase = createBrowserSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    const res = await fetch('/api/referral/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = (await res.json().catch(() => ({}))) as ReferralMe & { error?: string }
    if (res.ok && json.referral_code) {
      setData(json)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const copyShare = async () => {
    if (!data?.share_url) return
    try {
      await navigator.clipboard.writeText(data.share_url)
      addToast('Link copied', 'Share your referral link with teammates.', 'success')
    } catch {
      addToast('Copy failed', 'Select and copy the link manually.', 'error')
    }
  }

  const validateFriendCode = async () => {
    if (!friendCode.trim()) return
    setValidating(true)
    setFriendValid(null)
    const supabase = createBrowserSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/referral/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ referral_code: friendCode.trim(), plan: 'pro' }),
    })
    const json = (await res.json().catch(() => ({}))) as { valid?: boolean; reason?: string }
    setValidating(false)
    setFriendValid(Boolean(json.valid))
    if (json.valid) {
      addToast('Code valid', `${REFERRAL_PRO_DISCOUNT_PERCENT}% off Pro will apply at checkout.`, 'success')
    } else if (json.reason) {
      addToast('Code not valid', json.reason, 'error')
    }
  }

  if (loading) {
    return (
      <div className={`referral-panel${compact ? ' referral-panel--compact' : ''}`} aria-busy="true">
        <div className="referral-panel__skeleton" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={`referral-panel${compact ? ' referral-panel--compact' : ''}`}>
      <div className="referral-panel__header">
        <span className="referral-panel__icon" aria-hidden>
          <Gift size={18} />
        </span>
        <div>
          <h3 className="referral-panel__title">Referral rewards</h3>
          <p className="referral-panel__lead">
            Friends get {REFERRAL_PRO_DISCOUNT_PERCENT}% off Espeezy Pro with your code. You can reward up to{' '}
            {REFERRAL_PRO_MAX_REDEMPTIONS} Pro subscriptions per code.
          </p>
        </div>
      </div>

      <div className="referral-panel__code-row">
        <span className="referral-panel__code" data-testid="referral-code-display">
          {data.referral_code}
        </span>
        <button type="button" className="btn btn-secondary btn-inline referral-panel__copy" onClick={() => void copyShare()}>
          <Copy size={14} aria-hidden />
          Copy link
        </button>
      </div>

      <p className="referral-panel__slots">
        <Users size={14} aria-hidden />
        <span>
          <strong>{data.redemptions_remaining}</strong> of {data.max_redemptions} Pro discounts remaining on your code
        </span>
      </p>

      <p className="referral-panel__terms">{data.terms || REFERRAL_PROMO_TERMS}</p>

      {!compact && (
        <div className="referral-panel__friend">
          <label className="referral-panel__friend-label" htmlFor="referral-friend-code">
            Have a friend&apos;s code?
          </label>
          <div className="referral-panel__friend-row">
            <input
              id="referral-friend-code"
              className="referral-panel__friend-input"
              value={friendCode}
              onChange={(e) => {
                setFriendCode(e.target.value.toUpperCase().slice(0, 8))
                setFriendValid(null)
              }}
              placeholder="8-character code"
              maxLength={8}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="btn btn-secondary btn-inline"
              disabled={validating || friendCode.length < 8}
              onClick={() => void validateFriendCode()}
            >
              {validating ? 'Checking…' : friendValid === true ? 'Valid' : 'Check'}
            </button>
          </div>
          <p className="referral-panel__friend-hint">
            Apply at Pro checkout. Stored codes from shared links are applied automatically when you upgrade.
          </p>
        </div>
      )}
    </div>
  )
}
