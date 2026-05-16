import React, { useState } from 'react'

export function StripeWithdraw({ balanceCents }: { balanceCents: number }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleWithdraw = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const amountCents = Math.round(Number(amount) * 100)
      if (!amountCents || amountCents < 100) {
        setError('Minimum withdrawal is £1.00')
        setLoading(false)
        return
      }
      if (amountCents > balanceCents) {
        setError('Insufficient balance')
        setLoading(false)
        return
      }
      const res = await fetch('/api/stripe/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Withdrawal initiated! Funds will arrive in your bank account soon.')
        setAmount('')
      } else {
        setError(data.error || 'Withdrawal failed.')
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ margin: '2rem 0', padding: '2rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
      <h2 style={{ fontWeight: 900, marginBottom: '1rem' }}>Withdraw Funds</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem' }}>
        Your available balance: <b>£{(balanceCents / 100).toFixed(2)}</b>
      </p>
      <input
        type="number"
        min="1"
        step="0.01"
        placeholder="Amount (£)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem', marginBottom: '1rem', width: '180px' }}
      />
      <br />
      <button onClick={handleWithdraw} disabled={loading} style={{ padding: '1rem 2rem', borderRadius: '16px', background: 'var(--brand)', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '1rem', marginTop: '1rem' }}>
        {loading ? 'Processing…' : 'Withdraw'}
      </button>
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: '1rem' }}>{success}</div>}
    </div>
  )
}
