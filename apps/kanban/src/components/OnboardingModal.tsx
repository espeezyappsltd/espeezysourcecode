'use client'

import { useState, useEffect, useId, useCallback, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  X,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { OnboardingModalProps } from '@/types/ui'
import { useProfile } from '@/context/ProfileContext'
import { CyclingNamePlaceholder, isMockDisplayName } from '@/components/onboarding/CyclingNamePlaceholder'
import { FormField } from '@/components/forms/FormField'

const PRESET_AVATARS = [
  { url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar1&backgroundColor=1a73e8', label: 'Blue geometric' },
  { url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar2&backgroundColor=34a853', label: 'Green geometric' },
  { url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar3&backgroundColor=ea4335', label: 'Red geometric' },
  { url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar4&backgroundColor=fbbc04', label: 'Yellow geometric' },
  { url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar5&backgroundColor=9334e1', label: 'Purple geometric' },
  { url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar6&backgroundColor=111111', label: 'Dark geometric' },
  { url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar7&backgroundColor=ef4444', label: 'Coral geometric' },
  { url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar8&backgroundColor=22c55e', label: 'Mint geometric' },
]

const STEP_LABELS = ['Name', 'Avatar', 'Complete'] as const

const focusRing: CSSProperties = {
  outline: '2px solid var(--brand)',
  outlineOffset: '2px',
}

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [nameFieldFocused, setNameFieldFocused] = useState(false)
  const { profile, refreshProfile, setProfile } = useProfile()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const titleId = useId()
  const descId = useId()
  const nameInputId = useId()
  const nameDecorId = useId()
  const statusId = useId()

  useEffect(() => {
    setMounted(true)
    if (profile?.full_name && !isMockDisplayName(profile.full_name)) {
      setFullName(profile.full_name)
    }
  }, [profile])

  useEffect(() => {
    if (!mounted) return
    closeBtnRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [mounted])

  const handleDismiss = useCallback(() => {
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleDismiss()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleDismiss])

  const db = createBrowserSupabaseClient()

  if (!mounted) return null

  const handleNext = async () => {
    if (step === 1 && !fullName.trim()) return
    if (step === 2 && !selectedAvatar) return

    if (step === 3) {
      onComplete()
      return
    }

    setStep(step + 1)
    if (step === 2) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!reduceMotion) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1a73e8', '#34a853', '#ea4335', '#fbbc04'],
        })
      }
    }
  }

  const saveIdentity = async () => {
    setSaving(true)
    const { error } = await db.from('profiles').upsert({
      id: user.id,
      full_name: fullName.trim(),
      username: fullName.trim().toLowerCase().replace(/\s+/g, ''),
      avatar_url: selectedAvatar,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
    if (!error) {
      await refreshProfile()
      void handleNext()
    }
  }

  return (
    <div
      className="onboarding-overlay"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="onboarding-content"
        style={{
          maxWidth: '500px',
          width: '90%',
          background: 'var(--surface)',
          borderRadius: '32px',
          border: '1px solid var(--border)',
          padding: '2rem 1.5rem',
          position: 'relative',
          overflowY: 'auto',
          maxHeight: 'calc(100dvh - 8rem)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-sub)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
          aria-label="Close profile setup"
          onFocus={(e) => Object.assign(e.currentTarget.style, focusRing)}
          onBlur={(e) => {
            e.currentTarget.style.outline = ''
            e.currentTarget.style.outlineOffset = ''
          }}
        >
          <X size={24} aria-hidden="true" />
        </button>

        <div
          role="progressbar"
          aria-label="Profile setup progress"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
          aria-valuetext={`Step ${step} of 3: ${STEP_LABELS[step - 1]}`}
          style={{ display: 'flex', gap: '8px', marginBottom: '3rem' }}
        >
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1
            const active = stepNum <= step
            return (
              <div
                key={label}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '10px',
                  background: active ? 'var(--brand)' : 'var(--bg-main)',
                }}
                aria-hidden="true"
              />
            )
          })}
        </div>

        <p id={statusId} className="sr-only" aria-live="polite" aria-atomic="true">
          Step {step} of 3: {STEP_LABELS[step - 1]}
        </p>

        {step === 1 && (
          <div>
            <div
              style={{
                padding: '1rem',
                background: 'rgba(26, 115, 232, 0.1)',
                color: 'var(--brand)',
                borderRadius: '16px',
                display: 'inline-flex',
                marginBottom: '1.5rem',
              }}
              aria-hidden="true"
            >
              <ShieldCheck size={32} />
            </div>
            <h1 id={titleId} style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>
              Welcome to Espeezy
            </h1>
            <p id={descId} style={{ color: 'var(--text-sub)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              Let&apos;s set up your profile. What name should we show in the dashboard?
            </p>

            <FormField
              label="Your full name"
              hint="Enter your first and last name as you would like peers to see it."
              required
              className="onboarding-name-field"
              afterControl={
                !fullName && !nameFieldFocused ? (
                  <div
                    aria-hidden
                    style={{
                      position: 'relative',
                      marginTop: '-3.25rem',
                      height: '3.25rem',
                      marginBottom: '-3.25rem',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  >
                    <CyclingNamePlaceholder id={nameDecorId} />
                  </div>
                ) : null
              }
            >
              <input
                id={nameInputId}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setNameFieldFocused(true)}
                onBlur={() => setNameFieldFocused(false)}
                placeholder=""
                autoComplete="name"
                required
                style={{
                  fontSize: '1.25rem',
                  padding: '1rem',
                  position: 'relative',
                  zIndex: 1,
                  background: 'transparent',
                  minHeight: '44px',
                }}
              />
            </FormField>

            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={!fullName.trim()}
              aria-disabled={!fullName.trim()}
              className="btn btn-primary"
              style={{
                marginTop: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                minHeight: '44px',
                width: '100%',
              }}
            >
              Continue
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 id={titleId} style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>
              Choose an Avatar
            </h2>
            <p id={descId} style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>
              Select a profile icon to represent you in the workspace.
            </p>

            <div
              role="radiogroup"
              aria-label="Avatar options, choose one"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '3rem' }}
            >
              {PRESET_AVATARS.map((avatar) => {
                const selected = selectedAvatar === avatar.url
                return (
                  <button
                    key={avatar.url}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={avatar.label}
                    onClick={() => setSelectedAvatar(avatar.url)}
                    style={{
                      padding: 0,
                      border: selected ? '3px solid var(--brand)' : '1px solid var(--border)',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'var(--bg-main)',
                      cursor: 'pointer',
                      minWidth: '44px',
                      minHeight: '44px',
                      aspectRatio: '1',
                    }}
                    onFocus={(e) => Object.assign(e.currentTarget.style, focusRing)}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = ''
                      e.currentTarget.style.outlineOffset = ''
                    }}
                  >
                    <Image
                      src={avatar.url}
                      alt=""
                      width={100}
                      height={100}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => void saveIdentity()}
              disabled={!selectedAvatar || saving}
              aria-disabled={!selectedAvatar || saving}
              aria-busy={saving}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                minHeight: '44px',
                width: '100%',
              }}
            >
              {saving ? 'Saving profile…' : 'Finish setup'}
              <CheckCircle2 size={20} aria-hidden="true" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                background: 'var(--success)',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
                boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
              }}
              aria-hidden="true"
            >
              <Sparkles size={48} />
            </div>
            <h2 id={titleId} style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>
              All Set!
            </h2>
            <p id={descId} style={{ color: 'var(--text-sub)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              Your profile is ready. Welcome to the team, {fullName.split(' ')[0]}.
            </p>

            <button
              type="button"
              onClick={() => void handleNext()}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                minHeight: '44px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              Go to Dashboard
              <Zap size={20} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .onboarding-overlay,
          .onboarding-content * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
