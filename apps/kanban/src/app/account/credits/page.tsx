'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Coins, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AccountWalletPanel } from '@/components/AccountWalletPanel'
import { FundCreditAccountButton } from '@/components/credits/FundCreditAccountButton'
import { MIN_CREDIT_FUND_GBP } from '@/lib/credits/fund-stripe-shared'
import './credits-account.css'

function CreditsAccountContent() {
  const searchParams = useSearchParams()
  const fund = searchParams?.get('fund')
  const sessionId = searchParams?.get('session_id')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    if (fund !== 'success' || !sessionId) return

    setPolling(true)
    let attempts = 0
    const poll = async () => {
      const res = await fetch(`/api/credits/fund/status?session_id=${encodeURIComponent(sessionId)}`, {
        credentials: 'include',
      })
      const data = (await res.json()) as { status?: string; message?: string; balance?: number }
      if (data.status === 'completed') {
        setStatusMsg(data.message ?? 'Funds added to your account.')
        setPolling(false)
        return
      }
      if (data.message) setStatusMsg(data.message)
      attempts += 1
      if (attempts < 12) {
        setTimeout(poll, 2000)
      } else {
        setPolling(false)
        setStatusMsg('Payment received. If your balance has not updated, refresh in a moment.')
      }
    }
    void poll()
  }, [fund, sessionId])

  return (
    <div className="credits-account-page page-fade page-shell page-shell--narrow">
      <Link href="/settings" className="credits-account-page__back">
        <ArrowLeft size={16} aria-hidden />
        Settings
      </Link>

      <PageHeader
        className="credits-account-page__header"
        title="Your project balance"
        icon={Coins}
        description="Personal balance for marketplace listings, freelance gigs, and peer transactions."
      />

      {fund === 'success' && (
        <div className={`credits-account-banner${polling ? ' credits-account-banner--pending' : ''}`} role="status">
          {polling ? (
            <Loader2 className="animate-spin" size={20} aria-hidden />
          ) : (
            <CheckCircle2 size={20} aria-hidden />
          )}
          <span>{statusMsg ?? 'Confirming your payment…'}</span>
          {sessionId && !polling && (
            <Link
              href={`/account/credits/receipt?session_id=${encodeURIComponent(sessionId)}`}
              style={{ marginLeft: '0.75rem', fontWeight: 800, color: 'var(--brand)', whiteSpace: 'nowrap' }}
            >
              View receipt →
            </Link>
          )}
        </div>
      )}

      {fund === 'cancelled' && (
        <div className="credits-account-banner credits-account-banner--muted" role="status">
          Payment cancelled — no funds were added.
        </div>
      )}

      <section className="credits-account-fund-card central-type">
        <h2 className="central-eyebrow" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', color: 'var(--central-ink-soft)' }}>
          Add funds
        </h2>
        <p className="central-caption" style={{ marginBottom: '1rem' }}>
          Pay with Stripe (min £{MIN_CREDIT_FUND_GBP}). Balance updates after payment clears.
        </p>
        <FundCreditAccountButton oneClick={false} returnPath="/account/credits" label="Add funds" />
        <p className="central-caption" style={{ marginTop: '0.75rem' }}>
          £4.99 ≈ one month of Pro · secure checkout via Stripe
        </p>
      </section>

      <AccountWalletPanel />
    </div>
  )
}

export default function CreditsAccountPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <CreditsAccountContent />
    </Suspense>
  )
}
