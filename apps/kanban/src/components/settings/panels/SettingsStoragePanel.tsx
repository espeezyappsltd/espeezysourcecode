'use client'

import { CheckCircle2, HardDrive } from 'lucide-react'
import type { SettingsPageViewModel } from '../settings-types'

export function SettingsStoragePanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile } = vm
  if (!profile) return null

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Personal Storage Node</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>
        Manage your academic assets, private folders, and storage capacity.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: '24px', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <HardDrive size={24} color="var(--brand)" />
              <h3 style={{ margin: 0, fontWeight: 900 }}>Storage Status</h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--brand)' }}>
              {((profile.storage_used || 0) / (1024 * 1024)).toFixed(1)} MB Used
            </span>
          </div>

          <div
            style={{
              height: '10px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '100px',
              overflow: 'hidden',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--brand)',
                width: `${Math.min(100, ((profile.storage_used || 0) / (profile.subscription_plan === 'premium' ? 20 * 1024 * 1024 * 1024 : profile.subscription_plan === 'pro' ? 5 * 1024 * 1024 * 1024 : 1024 * 1024 * 1024)) * 100)}%`,
                borderRadius: '100px',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--text-sub)',
            }}
          >
            <span>Tier: {profile.subscription_plan?.toUpperCase() || 'FREE'}</span>
            <span>Quota: {profile.subscription_plan === 'premium' ? '20GB' : profile.subscription_plan === 'pro' ? '5GB' : '1GB'}</span>
          </div>

          <button
            type="button"
            onClick={() => (window.location.href = '/assets')}
            className="btn btn-primary"
            style={{ marginTop: '2rem', width: '100%' }}
          >
            Manage Assets
          </button>
        </div>

        <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 900, fontSize: '1rem' }}>Storage Features</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['Private Folders & CRUD', 'Direct Asset Linking', 'Automated Instructions', 'Secure RLS Protocol'].map((f) => (
              <li
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-sub)',
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={16} color="var(--success)" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
