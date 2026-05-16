import React, { useState } from 'react'

export function StripeOnboarding() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to initiate Stripe onboarding.')
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ margin: '2rem 0', padding: '2rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
      <h2 style={{ fontWeight: 900, marginBottom: '1rem' }}>Get Paid with Stripe</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem' }}>
        Connect your Stripe account to securely receive payments for your marketplace listings. You’ll be redirected to Stripe to complete onboarding.
      </p>
      <button onClick={handleConnect} disabled={loading} style={{ padding: '1rem 2rem', borderRadius: '16px', background: 'var(--brand)', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
        {loading ? 'Redirecting…' : 'Connect with Stripe'}
      </button>
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
    </div>
  )
}
