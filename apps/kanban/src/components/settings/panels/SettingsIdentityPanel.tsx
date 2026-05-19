'use client'

import Image from 'next/image'
import { Calendar, Globe, Lock, Phone, Shield, Sparkles, User } from 'lucide-react'
import { detectCountry, getFlagComponent } from '@/utils/geo'
import type { SettingsPageViewModel } from '../settings-types'
import { FormField } from '@/components/forms/FormField'

export function SettingsIdentityPanel({ vm }: { vm: SettingsPageViewModel }) {
  const {
    profile,
    avatarUrl,
    uploadingAvatar,
    handleFileUpload,
    handleToggleAvatarProtection,
    protectAvatar,
    fullName,
    setFullName,
    courseName,
    setCourseName,
    rank,
    setRank,
    phoneNumber,
    setPhoneNumber,
    countryCode,
    setCountryCode,
    tagline,
    setTagline,
    biography,
    setBiography,
    stack,
    setStack,
    enrollmentYear,
    setEnrollmentYear,
    completionYear,
    setCompletionYear,
    saving,
    handleUpdateProfile,
  } = vm

  const CountryFlagIcon = getFlagComponent(countryCode)
  const countryFlagIcon = CountryFlagIcon ? <CountryFlagIcon /> : <Globe size={18} />

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <User size={24} className="text-brand" />
        Profile Identity
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 'var(--avatar-size)', height: 'var(--avatar-size)' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              background:
                profile?.subscription_plan === 'lifetime' || profile?.subscription_plan === 'premium'
                  ? 'linear-gradient(45deg, #d4af37, #ffdf00, #d4af37)'
                  : profile?.subscription_plan === 'pro'
                    ? 'linear-gradient(45deg, var(--brand), #6366f1)'
                    : 'transparent',
              animation: profile?.subscription_plan && profile.subscription_plan !== 'free' ? 'spin 3s linear infinite' : 'none',
              opacity: profile?.subscription_plan && profile.subscription_plan !== 'free' ? 1 : 0,
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'var(--bg-sub)',
              border: '2px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Profile avatar" fill sizes="120px" style={{ objectFit: 'cover' }} unoptimized />
            ) : (
              <User size={32} color="var(--text-sub)" />
            )}
          </div>

          {profile?.subscription_plan && profile.subscription_plan !== 'free' && (
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: profile.subscription_plan === 'lifetime' ? 'linear-gradient(135deg, #d4af37 0%, #ffdf00 100%)' : 'var(--brand)',
                color: profile.subscription_plan === 'lifetime' ? 'black' : 'white',
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '0.65rem',
                fontWeight: 950,
                boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                filter: profile.subscription_plan === 'lifetime' ? 'url(#glow-gold)' : 'url(#elite-shimmer)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={12} />
              {profile.subscription_plan === 'lifetime' ? 'LIFETIME SCHOLAR' : profile.subscription_plan === 'premium' ? 'ELITE SCHOLAR' : 'PRO MEMBER'}
            </div>
          )}

          <label
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              minWidth: '110px',
              padding: '0.6rem 0.9rem',
              borderRadius: '18px',
              background: 'var(--brand)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid var(--surface)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.01em',
              zIndex: 3,
            }}
          >
            Upload Photo
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Profile Photo</h3>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Update your professional identity.</p>
          {uploadingAvatar && <p style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 800, marginTop: '0.4rem' }}>Optimizing...</p>}

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => handleToggleAvatarProtection(!protectAvatar)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: protectAvatar ? 'rgba(var(--brand-rgb), 0.1)' : 'var(--bg-sub)',
                border: '1px solid var(--border)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: protectAvatar ? 'var(--brand)' : 'var(--text-sub)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              {protectAvatar ? <Lock size={12} /> : <Shield size={12} />}
              {protectAvatar ? 'Profile Protection: ACTIVE' : 'Enable Profile Protection'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--gap-md)' }}>
          <FormField label="Full Name">
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
          </FormField>
          <FormField label="Degree/Course">
            <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. Computer Science" />
          </FormField>
          <FormField label="Achievement Rank">
            <input type="text" value={rank} onChange={(e) => setRank(e.target.value)} placeholder="e.g. Senior" />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--gap-md)' }}>
          <FormField label="Phone Number (International)" icon={<Phone size={16} />}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value)
                const detected = detectCountry(e.target.value)
                if (detected) setCountryCode(detected)
              }}
              placeholder="+1 555 000 0000"
            />
          </FormField>
          <FormField label="Country Flag" icon={countryFlagIcon}>
            <input
              type="text"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase().substring(0, 2))}
              placeholder="US, GB, KE..."
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1rem' }}>
          <FormField label="Tagline / Preferred Title" hint="This appears on your profile and public scholar card.">
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Research Lead, PhD Candidate" />
          </FormField>
          <FormField
            label="Professional Biography"
            hint="Share your research interests, achievements, and strengths."
            afterControl={
              <div style={{ marginTop: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: biography.trim().split(/\s+/).filter(Boolean).length > 500 ? 'var(--error)' : 'var(--text-sub)',
                  }}
                >
                  {biography.trim() ? biography.trim().split(/\s+/).filter(Boolean).length : 0} of 500 words
                </span>
              </div>
            }
          >
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              rows={6}
              placeholder="Write up to 500 words about your research focus, experience, and goals."
              style={{ resize: 'vertical', minHeight: '140px' }}
            />
          </FormField>

          <FormField label="Technical Arsenal (Stack)" hint="List your primary tools, languages, and frameworks.">
            <input type="text" value={stack} onChange={(e) => setStack(e.target.value)} placeholder="e.g. React, Next.js, FastAPI, PostgreSQL" />
          </FormField>
        </div>

        <div style={{ background: 'rgba(var(--brand-rgb), 0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
            <Calendar size={14} color="var(--brand)" />
            My School
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
            <FormField label="Enrollment">
              <input type="number" value={enrollmentYear} onChange={(e) => setEnrollmentYear(parseInt(e.target.value) || new Date().getFullYear())} />
            </FormField>
            <FormField label="Completion">
              <input
                type="number"
                value={completionYear}
                onChange={(e) => setCompletionYear(parseInt(e.target.value) || new Date().getFullYear() + 3)}
              />
            </FormField>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
            {saving ? 'Syncing...' : 'Update Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
