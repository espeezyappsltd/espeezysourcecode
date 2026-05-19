'use client'

import { ArrowUpRight, CreditCard, Shield, Sparkles } from 'lucide-react'
import { AccountWalletPanel } from '@/components/AccountWalletPanel'
import type { SettingsPageViewModel } from '../settings-types'
import { BILLING_PANEL_SUBTITLE } from '@/lib/platform/brand-copy'

export function SettingsBillingPanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile, handleManageSubscription, loadingPortal, handleCheckout, switching } = vm
  if (!profile) return null

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Subscription & Billing</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>{BILLING_PANEL_SUBTITLE}</p>

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
              {profile.subscription_plan === 'premium' ? 'Premium Lifetime' : profile.subscription_plan === 'pro' ? 'Pro Monthly' : 'Standard Free'}
            </h3>
          </div>
          <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            {profile.subscription_plan
              ? `Active since ${new Date(profile.subscription_started_at || '1970-01-01').toLocaleDateString()}`
              : 'Unlock professional project features.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {profile.subscription_plan ? (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="btn btn-primary"
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loadingPortal ? 'Opening...' : 'Manage Billing'}
              <ArrowUpRight size={16} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => handleCheckout('pro')}
                disabled={switching}
                className="btn btn-primary"
                style={{ width: 'auto' }}
              >
                {switching ? 'Connecting...' : 'Try Pro'}
              </button>
              <button
                type="button"
                onClick={() => handleCheckout('premium')}
                disabled={switching}
                className="btn btn-secondary"
                style={{ width: 'auto' }}
              >
                {switching ? 'Connecting...' : 'Go Premium'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '1rem' }}>Marketplace wallet</h3>
        <AccountWalletPanel />
      </div>

      {!profile.subscription_plan && (
        <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(var(--brand-rgb), 0.05)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--brand)" /> Pro Support
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '1rem' }}>
              Unlock advanced team analytics and exclusive Pro themes for £2.99/mo.
            </p>
            <button
              type="button"
              onClick={() => handleCheckout('pro')}
              disabled={switching}
              className="btn btn-sm btn-primary"
            >
              Select Pro
            </button>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid #d4af37' }}>
            <h4 style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d4af37' }}>
              <Sparkles size={18} /> Premium Partner
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '1rem' }}>
              The ultimate mission experience with luxury themes and lifetime access.
            </p>
            <button
              type="button"
              onClick={() => handleCheckout('premium')}
              disabled={switching}
              className="btn btn-sm btn-primary shimmer-gold"
              style={{ background: '#d4af37' }}
            >
              Go Premium
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
