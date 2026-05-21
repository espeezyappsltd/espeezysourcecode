'use client'

import { ArrowUpRight, CreditCard, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { AccountWalletPanel } from '@/components/AccountWalletPanel'
import PlansUsagePanel from '@/components/PlansUsagePanel'
import type { SettingsPageViewModel } from '../settings-types'
import { BILLING_PANEL_SUBTITLE } from '@/lib/platform/brand-copy'
import { APP_PRICING_PATH, planRank } from '@/lib/pricing/plan-routes'
import { ReferralProgramPanel } from '@/components/ReferralProgramPanel'
import '@/components/referral-panel.css'

function statusLabel(status: string | null | undefined): string {
  if (!status) return 'Active'
  switch (status.toLowerCase()) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trial'
    case 'canceling':
      return 'Cancels at period end'
    case 'past_due':
      return 'Payment issue'
    case 'canceled':
      return 'Canceled'
    default:
      return status
  }
}

export function SettingsBillingPanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile, handleManageSubscription, handleCheckout, loadingPortal, switching } = vm
  if (!profile) return null

  const plan = (profile.subscription_plan ?? 'free').toLowerCase()
  const isSubscribed = plan !== 'free' && Boolean(profile.stripe_customer_id)
  const canPortal = isSubscribed
  const showUpgrade = planRank(plan) < planRank('pro')

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Subscription & Billing</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '1.25rem' }}>{BILLING_PANEL_SUBTITLE}</p>

      <div style={{ marginBottom: '1.75rem' }}>
        <ReferralProgramPanel />
      </div>

      <div
        style={{
          padding: '2rem',
          borderRadius: '24px',
          background: 'rgba(var(--brand-rgb), 0.03)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '8px', background: 'var(--brand)', borderRadius: '10px', color: 'white' }}>
              <CreditCard size={20} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 900 }}>
              {plan === 'premium'
                ? 'Premium'
                : plan === 'pro'
                  ? 'Pro'
                  : plan === 'lifetime'
                    ? 'Lifetime Scholar'
                    : 'Free'}
            </h3>
            {plan !== 'free' && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  background: 'rgba(var(--brand-rgb), 0.12)',
                  color: 'var(--brand)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {statusLabel(profile.subscription_status)}
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem', maxWidth: '420px', lineHeight: 1.5 }}>
            {plan === 'free'
              ? 'Upgrade in one step, or compare plans on the pricing page.'
              : canPortal
                ? 'Change plan, update payment method, or cancel anytime in the Stripe billing portal. You keep access until the end of your billing period after canceling.'
                : 'Your plan is active. Contact support if billing looks incorrect.'}
          </p>
        </div>

        <div className="btn-row">
          {showUpgrade && (
            <button
              type="button"
              onClick={() => void handleCheckout('pro')}
              disabled={switching}
              className="btn btn-primary btn-row__btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Sparkles size={16} aria-hidden />
              {switching ? 'Opening checkout…' : 'Upgrade to Pro'}
            </button>
          )}
          {plan === 'pro' && (
            <button
              type="button"
              onClick={() => void handleCheckout('premium')}
              disabled={switching}
              className="btn btn-secondary btn-row__btn"
            >
              {switching ? 'Opening…' : 'Upgrade to Premium'}
            </button>
          )}
          {canPortal && (
            <button
              type="button"
              onClick={() => void handleManageSubscription()}
              disabled={loadingPortal}
              className="btn btn-secondary btn-row__btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loadingPortal ? 'Opening portal…' : 'Manage billing'}
              <ArrowUpRight size={16} />
            </button>
          )}
          <Link
            href={APP_PRICING_PATH}
            className="btn btn-secondary btn-row__btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            View all plans
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '1rem' }}>Your usage</h3>
        <PlansUsagePanel />
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '1rem' }}>Marketplace wallet</h3>
        <AccountWalletPanel />
      </div>
    </div>
  )
}
