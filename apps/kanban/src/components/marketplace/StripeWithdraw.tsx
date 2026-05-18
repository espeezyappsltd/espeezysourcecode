'use client'

import { useEffect, useState } from 'react'
import { formatCredits, formatGbpApprox } from '@/lib/credits'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { marketplaceWithdrawCopy } from '@/lib/platform/transaction-confirm-copy'

/** @deprecated Prefer TradingMetricsDashboard on /assets — uses asset value × times sold cap. */
export function StripeWithdraw({ balanceCents: _balanceCents }: { balanceCents: number }) {
  const { confirmTransaction } = useTransactionConfirm()
  const [available, setAvailable] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/assets/trading-metrics', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { availableWithdrawCredits?: number }) => {
        if (typeof d.availableWithdrawCredits === 'number') setAvailable(d.availableWithdrawCredits)
      })
      .catch(() => setAvailable(0))
  }, [])

  const handleWithdraw = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const creditsAmount = parseInt(amount, 10)
      if (!Number.isFinite(creditsAmount) || creditsAmount < 1) {
        setError('Enter a valid credit amount')
        return
      }
      if (available !== null && creditsAmount > available) {
        setError(`Max withdrawable from sales: ${formatCredits(available)}`)
        return
      }

      const ok = await confirmTransaction(marketplaceWithdrawCopy(creditsAmount, 'stripe'))
      if (!ok) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/assets/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creditsAmount }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Withdrawal initiated! Funds will arrive in your bank account soon.')
        setAmount('')
      } else {
        setError(data.error || 'Withdrawal failed.')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', background: 'var(--surface)', borderRadius: 24, padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
      <h2 style={{ fontWeight: 900, marginBottom: '1rem' }}>Withdraw Funds</h2>
      <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Limited to marketplace earnings (asset value × times sold).{' '}
        <a href="/assets" style={{ color: 'var(--brand)', fontWeight: 800 }}>
          Open trading desk →
        </a>
      </p>
      {available !== null && (
        <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand)', marginBottom: '1rem' }}>
          Available: {formatCredits(available)} {formatGbpApprox(available)}
        </p>
      )}
      <input
        type="number"
        min={1}
        max={available ?? undefined}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Credits to withdraw"
        style={{ width: '100%', padding: '0.75rem', borderRadius: 12, border: '1px solid var(--border)', marginBottom: '1rem' }}
      />
      {error ? <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p> : null}
      {success ? <p style={{ color: '#10b981', marginBottom: '1rem' }}>{success}</p> : null}
      <button
        type="button"
        onClick={() => void handleWithdraw()}
        disabled={loading}
        style={{ padding: '1rem 2rem', borderRadius: 16, background: 'var(--brand)', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '1rem', width: '100%' }}
      >
        {loading ? 'Processing…' : 'Withdraw'}
      </button>
    </div>
  )
}
