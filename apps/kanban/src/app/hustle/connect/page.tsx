'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Briefcase, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

type ConnectStatus = {
  status?: string
  payoutsEnabled?: boolean
  error?: string
}

export default function HustleConnectPage() {
  const searchParams = useSearchParams()
  const success = searchParams?.get('success') === '1'
  const refresh = searchParams?.get('refresh') === '1'
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<ConnectStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/hustle/connect', { credentials: 'include' })
        const data = (await res.json().catch(() => ({}))) as ConnectStatus
        if (!cancelled) setStatus(data)
      } catch {
        if (!cancelled) setStatus({ error: 'Could not check payout account status.' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const startOnboarding = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/hustle/connect', { method: 'POST', credentials: 'include' })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else setStatus({ error: data.error ?? 'Stripe Connect is not available.' })
    } catch {
      setStatus({ error: 'Failed to start Stripe onboarding.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell" style={{ maxWidth: 520, margin: '2rem auto', padding: '0 1.25rem' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 950 }}>
        <Briefcase size={24} aria-hidden />
        Hustle payouts
      </h1>
      <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem' }}>
        Connect a bank account to receive cash withdrawals from marketplace and hustle earnings.
      </p>

      {loading ? (
        <p role="status">
          <Loader2 size={18} className="animate-spin" style={{ verticalAlign: 'middle' }} /> Checking account…
        </p>
      ) : status?.error ? (
        <div className="ui-panel" role="alert" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="var(--error)" aria-hidden />
          <p style={{ margin: 0 }}>{status.error}</p>
        </div>
      ) : success || status?.payoutsEnabled ? (
        <div className="ui-panel" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <CheckCircle2 size={22} color="var(--success)" aria-hidden />
          <div>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Payout account linked</p>
            <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              Status: {status?.status ?? 'active'}. Manage withdrawals from Personal Arsenal marketplace desk.
            </p>
          </div>
        </div>
      ) : (
        <div className="ui-panel">
          <p style={{ margin: '0 0 1rem' }}>
            {refresh
              ? 'Your onboarding link expired. Start again to finish connecting Stripe.'
              : 'Complete Stripe Express onboarding to enable payouts.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => void startOnboarding()}>
            Connect bank account
          </button>
        </div>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/hustle" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
          ← Back to Hustle Board
        </Link>
        {' · '}
        <Link href="/assets/impact">View impact log</Link>
      </p>
    </div>
  )
}
