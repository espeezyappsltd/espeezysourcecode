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
        setStatusMsg(data.message ?? 'Credits added to your account.')
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
        title="Your credit account"
        icon={Coins}
        description="Personal Espeezy credits for marketplace, hustle gigs, and campus trades."
      />

      {fund === 'success' && (
        <div className={`credits-account-banner${polling ? ' credits-account-banner--pending' : ''}`} role="status">
          {polling ? (
            <Loader2 className="animate-spin" size={20} aria-hidden />
          ) : (
            <CheckCircle2 size={20} aria-hidden />
          )}
          <span>{statusMsg ?? 'Confirming your payment…'}</span>
        </div>
      )}

      {fund === 'cancelled' && (
        <div className="credits-account-banner credits-account-banner--muted" role="status">
          Payment cancelled — no credits were added.
        </div>
      )}

      <section className="credits-account-fund-card">
        <h2>Add credits</h2>
        <p>
          Pay with Stripe (min £{MIN_CREDIT_FUND_GBP}). Credits appear in your balance only after payment succeeds.
        </p>
        <FundCreditAccountButton oneClick={false} returnPath="/account/credits" label="Fund cred acc now" />
        <p className="credits-account-fund-card__fine">
          50 credits ≈ one month of Pro · secure checkout via Espeezy
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
