'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import type { ImpactLogPayload } from '@/lib/assets/impact-log'
import { formatCredits, formatGbpApprox } from '@/lib/credits'

export function ImpactLogDashboard() {
  const [data, setData] = useState<ImpactLogPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/assets/impact-log', { credentials: 'include' })
      const json = (await res.json().catch(() => ({}))) as ImpactLogPayload & { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load impact log')
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load impact log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="impact-log__loading" role="status">
        <Loader2 size={22} className="animate-spin" aria-hidden />
        Loading verifiable impact log…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="impact-log__error ui-panel" role="alert">
        <p>{error ?? 'Impact log unavailable.'}</p>
        <button type="button" className="btn btn-secondary" onClick={() => void load()}>
          Retry
        </button>
      </div>
    )
  }

  const { summary, hustle, entries } = data

  return (
    <section className="impact-log" aria-labelledby="impact-log-heading">
      <div className="impact-log__toolbar">
        <h2 id="impact-log-heading" className="impact-log__title">
          <ShieldCheck size={20} aria-hidden /> Verifiable impact log
        </h2>
        <button type="button" className="btn btn-secondary impact-log__refresh" onClick={() => void load()}>
          <RefreshCw size={16} aria-hidden /> Refresh
        </button>
      </div>
      <p className="impact-log__desc">
        Every row is backed by a marketplace invoice, withdrawal record, or hustle escrow ledger entry. Use the
        verification ID to audit credits in and out.
      </p>

      <div className="impact-log__kpis">
        <div className="impact-log__kpi ui-panel ui-panel--compact">
          <TrendingUp size={18} aria-hidden />
          <span className="impact-log__kpi-label">Credits in</span>
          <strong>{formatCredits(summary.creditsIn)}</strong>
          <span className="impact-log__kpi-hint">{formatGbpApprox(summary.creditsIn)}</span>
        </div>
        <div className="impact-log__kpi ui-panel ui-panel--compact">
          <Activity size={18} aria-hidden />
          <span className="impact-log__kpi-label">Credits out</span>
          <strong>{formatCredits(summary.creditsOut)}</strong>
          <span className="impact-log__kpi-hint">{formatGbpApprox(summary.creditsOut)}</span>
        </div>
        <div className="impact-log__kpi ui-panel ui-panel--compact">
          <Briefcase size={18} aria-hidden />
          <span className="impact-log__kpi-label">Hustle earned</span>
          <strong>{formatCredits(hustle.creditsEarned)}</strong>
          <span className="impact-log__kpi-hint">
            {hustle.gigsCompletedAsWorker} gig{hustle.gigsCompletedAsWorker === 1 ? '' : 's'} paid
          </span>
        </div>
        <div className="impact-log__kpi ui-panel ui-panel--compact">
          <span className="impact-log__kpi-label">Hustle posted</span>
          <strong>{hustle.gigsPosted}</strong>
          <span className="impact-log__kpi-hint">{hustle.gigsPaidAsPoster} completed payouts</span>
        </div>
      </div>

      <div className="impact-log__breakdown ui-panel">
        <h3>Source breakdown</h3>
        <ul className="impact-log__breakdown-list">
          <li>
            <span>Marketplace in</span>
            <strong>{formatCredits(summary.marketplaceIn)}</strong>
          </li>
          <li>
            <span>Hustle in</span>
            <strong>{formatCredits(summary.hustleIn)}</strong>
          </li>
          <li>
            <span>Hustle out (escrow + fees)</span>
            <strong>{formatCredits(summary.hustleOut)}</strong>
          </li>
          <li>
            <span>Escrow funded</span>
            <strong>{formatCredits(hustle.creditsSpentEscrow)}</strong>
          </li>
          <li>
            <span>Refunded</span>
            <strong>{formatCredits(hustle.creditsRefunded)}</strong>
          </li>
        </ul>
        <Link href="/studio" className="impact-log__hustle-link">
          Open Espeezy Studio →
        </Link>
      </div>

      <div className="impact-log__panel ui-panel">
        <h3>
          <Activity size={18} aria-hidden /> Timeline ({summary.totalEvents} events)
        </h3>
        {entries.length === 0 ? (
          <p className="impact-log__empty">
            No verified impact yet. Complete a marketplace sale or hustle gig to populate this log.
          </p>
        ) : (
          <ul className="impact-log__list">
            {entries.map((item) => (
              <li
                key={`${item.source}-${item.id}`}
                className={`impact-log__row impact-log__row--${item.source} impact-log__row--${item.kind}`}
              >
                <div className={`impact-log__icon impact-log__icon--${item.direction}`}>
                  {item.direction === 'in' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
                <div className="impact-log__body">
                  <div className="impact-log__row-title">{item.title}</div>
                  <div className="impact-log__row-sub">{item.subtitle}</div>
                  <div className="impact-log__verify">
                    <span className="impact-log__verify-label">{item.verificationLabel}</span>
                    <code title={item.verificationId}>{item.verificationId.slice(0, 12)}…</code>
                  </div>
                </div>
                <div className="impact-log__amount">
                  <span className={item.direction === 'in' ? 'positive' : 'negative'}>
                    {item.direction === 'in' ? '+' : '−'}
                    {formatCredits(item.credits)}
                  </span>
                  <span className="impact-log__muted">{formatGbpApprox(item.credits)}</span>
                </div>
                {item.href ? (
                  <Link href={item.href} className="impact-log__link" aria-label={`View ${item.title}`}>
                    <ExternalLink size={14} aria-hidden />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
