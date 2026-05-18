'use client'

import Image from 'next/image'
import {
  Activity as PulseIcon,
  Award,
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  Palette as PaletteIcon,
  Shield,
  X,
} from 'lucide-react'
import { PALETTES } from '@/context/ThemeContext'
import { canAccessPaletteTier } from '@/utils/feature-gate'
import type { SettingsPageViewModel } from '../settings-types'

export function SettingsAppearancePanel({ vm }: { vm: SettingsPageViewModel }) {
  const {
    profile,
    currentPalette,
    setPalette,
    addToast,
    getErrorMessage,
    setActiveTab,
    isToasterMode,
    setIsToasterMode,
    customBg,
    setCustomBg,
    uploadingBg,
    handleFileUpload,
  } = vm

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Look & Feel</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>
        Customize your workspace with high-end, professionally curated themes.
      </p>

      <div
        style={{
          marginBottom: '3.5rem',
          padding: '1.5rem',
          background: isToasterMode ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isToasterMode ? 'var(--brand)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isToasterMode ? 'white' : 'var(--text-sub)' }}>
            <PulseIcon size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Low Power Mode</h3>
            <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: 600 }}>
              Optimizes performance for low-end devices and slow connections by disabling heavy visual effects.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !isToasterMode
            setIsToasterMode(next)
            localStorage.setItem('gf_toaster_mode', String(next))
            if (next) document.body.classList.add('toaster-mode')
            else document.body.classList.remove('toaster-mode')
            addToast('Performance Protocol Updated', next ? 'Low Power Mode enabled.' : 'Standard performance restored.', 'info')
          }}
          className={isToasterMode ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
        >
          {isToasterMode ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>

      {(['free', 'pro', 'premium', 'lifetime'] as const).map((tier) => {
        if (tier === 'lifetime' && profile?.subscription_plan !== 'lifetime') return null

        const tierThemes = PALETTES.filter((p) => (p.tier || 'free') === tier)
        const paletteTier = tier === 'lifetime' ? 'premium' : tier
        const canAccess = canAccessPaletteTier(profile, paletteTier as 'free' | 'pro' | 'premium')
        const isLocked = !canAccess

        return (
          <div key={tier} style={{ marginBottom: '3.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.75rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: tier === 'premium' ? '#d4af37' : tier === 'pro' ? 'var(--brand)' : 'var(--text-sub)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                {tier === 'premium' ? <Award size={20} /> : tier === 'pro' ? <Shield size={20} /> : <PaletteIcon size={20} />}
                {tier} Collection
              </h3>
              {isLocked && (
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className="btn btn-sm btn-primary shimmer-gold"
                  style={{ width: 'auto', background: tier === 'premium' ? 'linear-gradient(135deg, #d4af37 0%, #ffdf00 100%)' : 'var(--brand)' }}
                >
                  Unlock {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {tierThemes.map((p) => (
                <div
                  key={p.name}
                  style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                  className={p.name === 'Gold Luxury' ? 'shimmer-gold premium-glow' : ''}
                >
                  <button
                    type="button"
                    disabled={!canAccess}
                    onClick={async () => {
                      try {
                        await setPalette(p.name)
                        addToast('Appearance Synced', `The ${p.name} palette has been successfully applied to your terminal.`, 'success')
                      } catch (err: unknown) {
                        const errorMessage = getErrorMessage(err)
                        if (errorMessage === 'PREMIUM_LOCKED' || errorMessage === 'PRO_LOCKED') {
                          addToast('Access Unauthorized', 'This visual protocol requires higher institutional clearance.', 'error')
                          setActiveTab('billing')
                        } else {
                          addToast('Sync Error', errorMessage || 'Failed to apply theme.', 'error')
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '1.25rem',
                      background: p.colors['--bg-sub'],
                      border: currentPalette.name === p.name ? `3px solid ${p.colors['--brand']}` : '1px solid var(--border)',
                      borderRadius: 'inherit',
                      textAlign: 'left',
                      cursor: canAccess ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 850, color: p.colors['--text-main'], fontSize: '0.95rem' }}>{p.name}</span>
                      {currentPalette.name === p.name && (
                        <div style={{ background: p.colors['--brand'], color: 'white', borderRadius: '50%', padding: '4px' }}>
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[p.colors['--brand'], p.colors['--accent'], p.colors['--bg-main'], p.colors['--text-main']].map((c, i) => (
                        <div key={i} style={{ width: '24px', height: '24px', borderRadius: '8px', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                      ))}
                    </div>
                  </button>

                  {isLocked && (
                    <div
                      className="glass-lock"
                      onClick={() => setActiveTab('billing')}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, cursor: 'pointer' }}
                    >
                      <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                        <Lock size={20} color="white" />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier} Only</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900 }}>
          <ImageIcon size={20} color="var(--brand)" /> Custom Canvas
        </h3>
        <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: '32px', padding: '3rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          {customBg ? (
            <div style={{ position: 'relative', width: '240px', height: '120px', borderRadius: '24px', overflow: 'hidden', margin: '0 auto 1.5rem', border: '3px solid var(--brand)', boxShadow: 'var(--shadow-lg)' }}>
              <Image src={customBg} alt="Custom workspace background" fill sizes="240px" style={{ objectFit: 'cover' }} unoptimized />
              <button
                type="button"
                onClick={() => setCustomBg(null)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'var(--error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px dashed var(--border)', color: 'var(--text-sub)' }}>
              <ImageIcon size={40} />
            </div>
          )}
          <label className="btn btn-primary shimmer-gold" style={{ width: 'auto', cursor: 'pointer', padding: '0.8rem 2rem' }}>
            {uploadingBg ? 'Syncing...' : customBg ? 'Swap Artwork' : 'Upload Custom Backdrop'}
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} style={{ display: 'none' }} />
          </label>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 600 }}>
            Immersive glassmorphism will adapt to your custom imagery.
          </p>
        </div>
      </div>
    </div>
  )
}
