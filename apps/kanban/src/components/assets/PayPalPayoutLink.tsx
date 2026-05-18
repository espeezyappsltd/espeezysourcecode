'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Link2, Unlink } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'
import type { PayoutAccounts } from '@/lib/marketplace/trading-metrics'

type PayPalStatus = {
  linked: boolean
  email: string | null
  payoutsConfigured: boolean
}

type Props = {
  payoutAccounts?: PayoutAccounts
  onLinked?: () => void
}

export function PayPalPayoutLink({ payoutAccounts, onLinked }: Props) {
  const { addToast } = useNotifications()
  const [status, setStatus] = useState<PayPalStatus | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/paypal/connect', { credentials: 'include' })
      const data = (await res.json()) as PayPalStatus & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load PayPal status')
      setStatus(data)
      if (data.email) setEmailInput(data.email)
    } catch {
      setStatus({
        linked: payoutAccounts?.paypalLinked ?? false,
        email: payoutAccounts?.paypalEmail ?? null,
        payoutsConfigured: payoutAccounts?.paypalPayoutsConfigured ?? false,
      })
    }
  }, [payoutAccounts])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const handleLinkEmail = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/paypal/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Could not link PayPal')
      addToast('PayPal linked', 'Withdrawals can be sent to this PayPal email.', 'success')
      await loadStatus()
      onLinked?.()
    } catch (e) {
      addToast('Link failed', e instanceof Error ? e.message : 'Could not link PayPal', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async () => {
    setOauthLoading(true)
    try {
      const res = await fetch('/api/paypal/connect/oauth', { credentials: 'include' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'PayPal sign-in unavailable')
      window.location.href = data.url
    } catch (e) {
      addToast('PayPal sign-in', e instanceof Error ? e.message : 'Unavailable', 'error')
      setOauthLoading(false)
    }
  }

  const handleUnlink = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/paypal/connect', { method: 'DELETE', credentials: 'include' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Could not unlink')
      addToast('PayPal unlinked', 'Your PayPal account was removed.', 'success')
      setEmailInput('')
      await loadStatus()
      onLinked?.()
    } catch (e) {
      addToast('Unlink failed', e instanceof Error ? e.message : 'Could not unlink', 'error')
    } finally {
      setLoading(false)
    }
  }

  const linked = status?.linked ?? payoutAccounts?.paypalLinked ?? false
  const displayEmail = status?.email ?? payoutAccounts?.paypalEmail

  return (
    <div className="trading-metrics__payout-rail">
      <div className="trading-metrics__payout-rail-head">
        <span className="trading-metrics__payout-label">PayPal</span>
        {linked ? (
          <span className="trading-metrics__payout-badge trading-metrics__payout-badge--ok">Linked</span>
        ) : (
          <span className="trading-metrics__payout-badge">Not linked</span>
        )}
      </div>

      {linked && displayEmail ? (
        <p className="trading-metrics__payout-email">{displayEmail}</p>
      ) : (
        <div className="trading-metrics__paypal-form">
          <input
            type="email"
            className="form-input"
            placeholder="PayPal email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={loading || !emailInput.trim()}
            onClick={() => void handleLinkEmail()}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Link email
          </button>
        </div>
      )}

      <div className="trading-metrics__paypal-actions">
        {!linked && status?.payoutsConfigured !== false && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={oauthLoading}
            onClick={() => void handleOAuth()}
          >
            {oauthLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            Sign in with PayPal
          </button>
        )}
        {linked && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={loading}
            onClick={() => void handleUnlink()}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
            Unlink
          </button>
        )}
      </div>

      {status?.payoutsConfigured === false && (
        <p className="trading-metrics__fine">PayPal payouts are not enabled on this environment yet.</p>
      )}
    </div>
  )
}