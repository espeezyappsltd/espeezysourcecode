'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Coins,
  Loader2,
  Receipt,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { TradingMetrics } from '@/lib/marketplace/trading-metrics'
import { formatCredits, formatGbpApprox } from '@/lib/credits'
import { useNotifications } from '@/components/NotificationProvider'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { marketplaceWithdrawCopy } from '@/lib/platform/transaction-confirm-copy'
import { PayPalPayoutLink } from '@/components/assets/PayPalPayoutLink'
import { FormField } from '@/components/forms/FormField'

function formatGbp(centsOrPounds: number, fromCents = false) {
  const pounds = fromCents ? centsOrPounds / 100 : centsOrPounds
  return `£${pounds.toFixed(2)}`
}

export function TradingMetricsDashboard() {
  const { addToast } = useNotifications()
  const { confirmTransaction } = useTransactionConfirm()
  const searchParams = useSearchParams()
  const [metrics, setMetrics] = useState<TradingMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [withdrawCredits, setWithdrawCredits] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'paypal'>('stripe')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/assets/trading-metrics', { credentials: 'include' })
      const data = (await res.json().catch(() => ({}))) as TradingMetrics & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load trading metrics')
      setMetrics(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (metrics?.payoutAccounts.preferredPayoutMethod) {
      setPayoutMethod(metrics.payoutAccounts.preferredPayoutMethod)
    }
  }, [metrics?.payoutAccounts.preferredPayoutMethod])

  useEffect(() => {
    const paypal = searchParams?.get('paypal')
    const message = searchParams?.get('message')
    if (paypal === 'linked') {
      addToast('PayPal linked', 'You can withdraw to your PayPal account.', 'success')
    } else if (paypal === 'error' && message) {
      addToast('PayPal linking failed', decodeURIComponent(message), 'error')
    }
  }, [searchParams, addToast])

  const setPreferredPayout = async (method: 'stripe' | 'paypal') => {
    setPayoutMethod(method)
    try {
      await fetch('/api/paypal/connect', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredPayoutMethod: method }),
      })
    } catch {
      /* preference is best-effort */
    }
  }

  const maxBar = useMemo(() => {
    if (!metrics?.assetPerformance.length) return 1
    return Math.max(...metrics.assetPerformance.map((a) => a.withdrawableCredits), 1)
  }, [metrics])

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawCredits, 10)
    if (!Number.isFinite(amount) || amount <= 0) {
      addToast('Invalid amount', 'Enter credits to withdraw.', 'error')
      return
    }

    const ok = await confirmTransaction(marketplaceWithdrawCopy(amount, payoutMethod))
    if (!ok) return

    setWithdrawing(true)
    try {
      const res = await fetch('/api/assets/withdraw', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsAmount: amount, payoutMethod }),
      })
      const data = (await res.json()) as { error?: string; success?: boolean; payoutMethod?: string }
      if (!res.ok) throw new Error(data.error ?? 'Withdrawal failed')
      const viaPayPal = data.payoutMethod === 'paypal' || payoutMethod === 'paypal'
      addToast(
        'Withdrawal sent',
        viaPayPal
          ? 'Funds are being sent to your linked PayPal account.'
          : 'Cash is on the way to your linked bank account.',
        'success',
      )
      setWithdrawCredits('')
      await load()
    } catch (e) {
      addToast('Withdrawal failed', e instanceof Error ? e.message : 'Try again', 'error')
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading && !metrics) {
    return (
      <section className="trading-metrics ui-panel ui-panel--gradient" aria-label="Marketplace trading metrics">
        <motion.div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto', color: 'var(--brand)' }} />
        </motion.div>
      </section>
    )
  }

  if (error && !metrics) {
    return (
      <section className="trading-metrics trading-metrics--error ui-panel ui-panel--dashed">
        <p>{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => void load()}>
          Retry
        </button>
      </section>
    )
  }

  if (!metrics) return null

  return (
    <section className="trading-metrics ui-panel ui-panel--gradient" aria-label="Marketplace trading metrics">
      <div className="trading-metrics__header">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="trading-metrics__title">
            <BarChart3 size={22} />
            Marketplace trading desk
          </h2>
          <p className="trading-metrics__subtitle">
            Withdraw only what you earned from sales: <strong>asset credit value × times sold</strong>, minus prior
            cash withdrawals. Your live credit balance is shown for reference.
          </p>
        </motion.div>
        <button type="button" className="btn btn-secondary trading-metrics__refresh" onClick={() => void load()}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="trading-metrics__kpis">
        <KpiCard
          label="Available to withdraw"
          value={formatCredits(metrics.availableWithdrawCredits)}
          hint={formatGbpApprox(metrics.availableWithdrawCredits)}
          icon={<Wallet size={20} />}
          accent
        />
        <KpiCard
          label="Lifetime sales (formula)"
          value={formatCredits(metrics.totalWithdrawableCredits)}
          hint={`${metrics.totalSalesCount} sale${metrics.totalSalesCount === 1 ? '' : 's'}`}
          icon={<TrendingUp size={20} />}
        />
        <KpiCard
          label="Already withdrawn"
          value={formatCredits(metrics.totalWithdrawnCredits)}
          hint={`${metrics.withdrawals.length} transfer${metrics.withdrawals.length === 1 ? '' : 's'}`}
          icon={<Banknote size={20} />}
        />
        <KpiCard
          label="Credit balance"
          value={String(metrics.creditsBalance)}
          hint="Spendable on campus marketplace"
          icon={<Coins size={20} />}
        />
        <KpiCard
          label="Purchases"
          value={String(metrics.totalPurchasesCount)}
          hint={formatCredits(metrics.grossPurchaseCredits) + ' spent'}
          icon={<ShoppingBag size={20} />}
        />
        <KpiCard
          label="Gross sales"
          value={formatCredits(metrics.grossSalesCredits)}
          hint="Credits received from buyers"
          icon={<Activity size={20} />}
        />
      </div>

      <div className="trading-metrics__grid ui-panel-split">
        <div className="trading-metrics__panel trading-metrics__panel--withdraw ui-panel">
          <h3>Cash withdrawal</h3>
          <p>
            Max today: <strong>{formatCredits(metrics.availableWithdrawCredits)}</strong>{' '}
            <span className="trading-metrics__muted">({formatGbpApprox(metrics.availableWithdrawCredits)})</span>
          </p>

          <div className="trading-metrics__payout-methods">
            <span className="trading-metrics__payout-methods-label">Send to</span>
            <label className="trading-metrics__payout-option">
              <input
                type="radio"
                name="payoutMethod"
                checked={payoutMethod === 'stripe'}
                onChange={() => void setPreferredPayout('stripe')}
              />
              Bank (Stripe)
            </label>
            <label className="trading-metrics__payout-option">
              <input
                type="radio"
                name="payoutMethod"
                checked={payoutMethod === 'paypal'}
                onChange={() => void setPreferredPayout('paypal')}
              />
              PayPal
            </label>
          </div>

          <div className="trading-metrics__payout-accounts">
            <div className="trading-metrics__payout-rail">
              <div className="trading-metrics__payout-rail-head">
                <span className="trading-metrics__payout-label">Bank (Stripe)</span>
                {metrics.payoutAccounts.stripeConnected ? (
                  <span className="trading-metrics__payout-badge trading-metrics__payout-badge--ok">
                    Connected
                  </span>
                ) : (
                  <span className="trading-metrics__payout-badge">Not connected</span>
                )}
              </div>
              {!metrics.payoutAccounts.stripeConnected && (
                <Link href="/marketplace" className="trading-metrics__payout-link">
                  Connect Stripe on Marketplace
                </Link>
              )}
            </div>
            <PayPalPayoutLink
              payoutAccounts={metrics.payoutAccounts}
              onLinked={() => void load()}
            />
          </div>

          <div className="trading-metrics__withdraw-form">
            <FormField label="Credits to convert" hideLabel>
              <input
                type="number"
                min={1}
                max={metrics.availableWithdrawCredits}
                placeholder="Credits to convert"
                value={withdrawCredits}
                onChange={(e) => setWithdrawCredits(e.target.value)}
              />
            </FormField>
            <button
              type="button"
              className="btn btn-primary"
              disabled={withdrawing || metrics.availableWithdrawCredits <= 0}
              onClick={() => void handleWithdraw()}
            >
              {withdrawing ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
              Withdraw
            </button>
          </div>
          <p className="trading-metrics__fine">
            Minimum £1.00. Link Stripe (bank) or PayPal above, then choose how to receive cash.
          </p>
        </div>

        <div className="trading-metrics__panel ui-panel">
          <h3>Performance by asset</h3>
          {metrics.assetPerformance.length === 0 ? (
            <p className="trading-metrics__empty">List arsenal assets on the marketplace to track sales here.</p>
          ) : (
            <ul className="trading-metrics__asset-list">
              {metrics.assetPerformance.map((row) => (
                <li key={row.assetId} className="trading-metrics__asset-row">
                  <div className="trading-metrics__asset-head">
                    <span className="trading-metrics__asset-title">{row.assetTitle}</span>
                    <span className="trading-metrics__asset-earned">
                      {formatCredits(row.withdrawableCredits)}
                    </span>
                  </div>
                  <div className="trading-metrics__asset-meta">
                    <span>{formatCredits(row.creditValue)} × {row.timesSold} sold</span>
                    {row.lastSoldAt ? (
                      <span>Last {new Date(row.lastSoldAt).toLocaleDateString()}</span>
                    ) : null}
                  </div>
                  <div className="trading-metrics__bar-track">
                    <motion.div
                      className="trading-metrics__bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.withdrawableCredits / maxBar) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="trading-metrics__panel trading-metrics__panel--activity ui-panel">
        <h3>
          <Activity size={18} /> Activity feed
        </h3>
        {metrics.activity.length === 0 ? (
          <p className="trading-metrics__empty">No marketplace trades yet.</p>
        ) : (
          <ul className="trading-metrics__activity">
            {metrics.activity.map((item) => (
              <li key={`${item.kind}-${item.id}`} className={`trading-metrics__activity-row trading-metrics__activity-row--${item.kind}`}>
                <div className={`trading-metrics__activity-icon trading-metrics__activity-icon--${item.direction}`}>
                  {item.direction === 'in' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
                <div className="trading-metrics__activity-body">
                  <div className="trading-metrics__activity-title">{item.title}</div>
                  <div className="trading-metrics__activity-sub">{item.subtitle}</div>
                </div>
                <div className="trading-metrics__activity-amount">
                  <span className={item.direction === 'in' ? 'positive' : 'negative'}>
                    {item.direction === 'in' ? '+' : '−'}
                    {formatCredits(item.credits)}
                  </span>
                  <span className="trading-metrics__muted">{formatGbp(item.gbpApprox)}</span>
                </div>
                {item.invoiceUrl ? (
                  <Link href={item.invoiceUrl} className="trading-metrics__invoice" target="_blank" rel="noopener noreferrer">
                    <Receipt size={14} />
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

function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <motion.div
      className={`trading-metrics__kpi ui-panel ui-panel--compact${accent ? ' trading-metrics__kpi--accent ui-panel--accent' : ''}`}
    >
      <div className="trading-metrics__kpi-icon">{icon}</div>
      <div className="trading-metrics__kpi-label">{label}</div>
      <div className="trading-metrics__kpi-value">{value}</div>
      <div className="trading-metrics__kpi-hint">{hint}</div>
    </motion.div>
  )
}
