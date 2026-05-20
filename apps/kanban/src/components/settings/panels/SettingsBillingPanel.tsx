'use client'

import { ArrowUpRight, CreditCard, ExternalLink } from 'lucide-react'
import { AccountWalletPanel } from '@/components/AccountWalletPanel'
import PlansUsagePanel from '@/components/PlansUsagePanel'
import type { SettingsPageViewModel } from '../settings-types'
import { BILLING_PANEL_SUBTITLE } from '@/lib/platform/brand-copy'
import { APP_PRICING_PATH } from '@/lib/pricing/plan-routes'

export function SettingsBillingPanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile, handleManageSubscription, loadingPortal } = vm
  if (!profile) return null

  const pricingPath = APP_PRICING_PATH

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Subscription & Billing</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>{BILLING_PANEL_SUBTITLE}</p>

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
              {profile.subscription_plan === 'premium'
                ? 'Premium'
                : profile.subscription_plan === 'pro'
                  ? 'Pro'
                  : profile.subscription_plan === 'lifetime'
                    ? 'Lifetime Scholar'
                    : 'Free'}
            </h3>
          </div>
          <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            {profile.subscription_plan
              ? `Active since ${new Date(profile.subscription_started_at || '1970-01-01').toLocaleDateString()}`
              : 'Compare plans and subscribe from the pricing page.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {profile.subscription_plan ? (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="btn btn-primary"
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loadingPortal ? 'Opening...' : 'Manage billing'}
              <ArrowUpRight size={16} />
            </button>
          ) : null}
          <a
            href={pricingPath}
            className="btn btn-primary"
            style={{
              width: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            View plans on espeezy.com
            <ExternalLink size={16} />
          </a>
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
