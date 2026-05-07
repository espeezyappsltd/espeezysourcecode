'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle, Mail, Sparkles, Users } from 'lucide-react'
import SharedCountdown from '@/components/SharedCountdown'
import UserRegistrationCounter from '@/components/UserRegistrationCounter'
import { useLaunchData } from '@/hooks/useLaunchData'

export default function PreRegisterPage() {
  const { config, registeredCount, timeLeft, setRegisteredCount } = useLaunchData()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [referrerCode, setReferrerCode] = useState<string | null>(null)
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null)
  const [myReferralCount, setMyReferralCount] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setReferrerCode(params.get('ref'))
  }, [])

  const goal = parseInt(config.preregister_goal, 10)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/preregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'preregister_page',
          referrer_code: referrerCode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed. Please try again.')
      } else {
        setSubmitted(true)
        setMyReferralCode(data.referral_code ?? null)
        setMyReferralCount(data.referral_count ?? 0)
        if (typeof data.count === 'number') setRegisteredCount(data.count)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem 5rem' }}>
      <section style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--brand)' }}>
          <Sparkles size={16} />
          <strong>Early Access Open</strong>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', margin: '0 0 1rem' }}>
          Pre-register for {config.brand_name}
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: 620, margin: '0 auto 2rem' }}>{config.launch_message}</p>
        <SharedCountdown timeLeft={timeLeft} />
        <UserRegistrationCounter registeredCount={registeredCount} goal={goal} />
      </section>

      <section id="register" style={{ maxWidth: 560, margin: '0 auto', background: 'var(--panel)', border: '1px solid #1d2a28', borderRadius: 16, padding: 24 }}>
        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={36} color="var(--brand)" />
            <h2 style={{ marginTop: 12 }}>You are on the list</h2>
            <p style={{ color: 'var(--muted)' }}>We will notify you when we launch.</p>

            {myReferralCode && (
              <div style={{ marginTop: 18, textAlign: 'left', background: '#0c1e1b', border: '1px solid #1f3f38', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="var(--brand)" />
                  <strong>Referral Link</strong>
                </div>
                <p style={{ marginBottom: 10, color: 'var(--muted)' }}>Invite friends to move up the waitlist.</p>
                <code style={{ fontSize: 12, display: 'block', marginBottom: 10, wordBreak: 'break-all' }}>
                  {`${window.location.origin}/preregister?ref=${myReferralCode}`}
                </code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/preregister?ref=${myReferralCode}`
                    void navigator.clipboard.writeText(url)
                  }}
                  style={{ background: 'var(--brand)', border: 0, color: '#fff', padding: '0.5rem 0.8rem', borderRadius: 8, cursor: 'pointer' }}
                >
                  Copy Link
                </button>
                <p style={{ marginTop: 10, color: 'var(--muted)' }}>Your referrals: {myReferralCount}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 style={{ marginTop: 0 }}>Join the waitlist</h2>
            <p style={{ color: 'var(--muted)' }}>No spam. Only launch and invite updates.</p>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #27403a', background: '#0a1614', color: '#fff' }}
              required
            />
            {error && <p style={{ color: '#fda4af', marginTop: 10 }}>{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', marginTop: 12, border: 0, borderRadius: 10, padding: 12, background: 'var(--brand)', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              {submitting ? 'Registering...' : (<><Mail size={16} /> Join Waitlist <ArrowRight size={14} /></>)}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
