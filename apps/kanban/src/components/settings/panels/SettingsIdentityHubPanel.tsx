'use client'

import { Activity as PulseIcon, CheckCircle2, Lock, Phone, Shield, ShieldAlert } from 'lucide-react'
import type { SettingsPageViewModel } from '../settings-types'
import { FormField } from '@/components/forms/FormField'

export function SettingsIdentityHubPanel({ vm }: { vm: SettingsPageViewModel }) {
  const {
    protectAvatar,
    handleToggleAvatarProtection,
    isGithubLinked,
    isGoogleLinked,
    handleLinkIdentity,
    isPhoneVerified,
    otpStep,
    phoneNumber,
    setPhoneNumber,
    handleRequestOtp,
    otp,
    setOtp,
    setOtpStep,
    handleVerifyOtp,
  } = vm

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={28} className="text-brand" />
          Identity Hub
        </h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>
          Manage your technical credentials, secure your profile data, and sync with professional providers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div
          style={{
            background: protectAvatar ? 'rgba(var(--brand-rgb), 0.03)' : 'var(--bg-sub)',
            border: protectAvatar ? '2px solid var(--brand)' : '1px solid var(--border)',
            borderRadius: '24px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: '0.3s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: protectAvatar ? 'var(--brand)' : 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: protectAvatar ? 'white' : 'var(--text-sub)',
              }}
            >
              {protectAvatar ? <Lock size={22} /> : <Shield size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850 }}>Profile Protection</h3>
              <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.7rem' }}>
                {protectAvatar ? 'Manual photo locked.' : 'Provider sync enabled.'}
              </p>
            </div>
          </div>
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: protectAvatar ? 'var(--brand)' : 'var(--text-sub)',
              }}
            >
              {protectAvatar ? 'PRIORITY_ACTIVE' : 'SYNC_ENABLED'}
            </span>
            <button
              type="button"
              onClick={() => handleToggleAvatarProtection(!protectAvatar)}
              className={protectAvatar ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'}
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}
            >
              {protectAvatar ? 'Unlock' : 'Lock Avatar'}
            </button>
          </div>
        </div>

        <div
          style={{
            background: isGithubLinked ? 'rgba(34, 197, 94, 0.03)' : 'var(--bg-sub)',
            border: isGithubLinked ? '1px solid var(--success)' : '1px solid var(--border)',
            borderRadius: '24px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <PulseIcon size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850 }}>GitHub Identity</h3>
              <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.7rem' }}>Technical archives sync.</p>
            </div>
          </div>
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {isGithubLinked ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 900, fontSize: '0.7rem' }}>
                <CheckCircle2 size={14} /> CONNECTED
              </div>
            ) : (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-sub)' }}>Disconnected</span>
            )}
            {!isGithubLinked && (
              <button type="button" onClick={() => handleLinkIdentity('github.com')} className="btn btn-sm btn-primary" style={{ width: 'auto' }}>
                Link
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            background: isGoogleLinked ? 'rgba(34, 197, 94, 0.03)' : 'var(--bg-sub)',
            border: isGoogleLinked ? '1px solid var(--success)' : '1px solid var(--border)',
            borderRadius: '24px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#ea4335',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 900,
              }}
            >
              G
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850 }}>Google Identity</h3>
              <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.7rem' }}>
                Smart sync for profile name and avatar.
              </p>
            </div>
          </div>
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {isGoogleLinked ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 900, fontSize: '0.7rem' }}>
                <CheckCircle2 size={14} /> CONNECTED
              </div>
            ) : (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-sub)' }}>Disconnected</span>
            )}
            {!isGoogleLinked && (
              <button type="button" onClick={() => handleLinkIdentity('google.com')} className="btn btn-sm btn-primary" style={{ width: 'auto' }}>
                Link
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            background: isPhoneVerified ? 'rgba(34, 197, 94, 0.03)' : 'var(--bg-sub)',
            border: isPhoneVerified ? '1px solid var(--success)' : '1px solid var(--border)',
            borderRadius: '24px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Phone size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850 }}>Phone Protocol</h3>
              <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.7rem' }}>SMS Verification</p>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {!isPhoneVerified && otpStep === 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <FormField label="Phone number" hideLabel icon={<Phone size={16} />}>
                  <input
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </FormField>
                <button type="button" onClick={handleRequestOtp} className="btn btn-sm btn-primary" style={{ width: '100%' }}>
                  Send Code
                </button>
              </div>
            )}

            {!isPhoneVerified && (otpStep === 'sent' || otpStep === 'verifying') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <FormField label="Verification code" hideLabel>
                  <input
                    type="text"
                    placeholder="Code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1rem', fontWeight: 900 }}
                  />
                </FormField>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" onClick={() => setOtpStep('idle')} className="btn btn-sm btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpStep === 'verifying' || otp.length < 6}
                    className="btn btn-sm btn-primary"
                    style={{ flex: 2 }}
                  >
                    {otpStep === 'verifying' ? '...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {isPhoneVerified && (
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--success)',
                    fontWeight: 900,
                    marginBottom: '0.25rem',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                  }}
                >
                  <CheckCircle2 size={18} /> VERIFIED
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{phoneNumber}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
