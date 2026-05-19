'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Sparkles, Lock, CheckCircle2, ArrowRight, Loader2,
  Users, CreditCard, Building2, Gift
} from 'lucide-react'
import Link from 'next/link'
import { buildStripePaymentLink, getPlanKey } from '@/lib/stripe-payment-links'
import { fetchLiveMetrics } from '@/services/launch'
import { createStripeCheckout } from '@/services/checkout'
import {
  CHECKOUT_TEAM_NOTE,
  LIFETIME_PLAN_DESCRIPTION,
  LIFETIME_PLAN_NAME,
  PREREG_LIFETIME_FEATURES,
} from '@shared/platform-brand'

const PLANS = {
  pro: {
    name: 'Espeezy Pro',
    price: 'GBP 4.99',
    period: '/month',
    badge: 'Best Place To Start',
    hasTrial: true,
    features: [
      'Unlimited group workspaces',
      'Deeper contribution analytics',
      'AI Study Coach credits each month',
      'Priority task templates and smarter planning',
      'Verified contributor badge',
      'Better export formats for proof of work',
      'Personal performance insights',
    ],
    description: 'The default paid plan for serious students who want better execution, clearer contribution visibility, and a measurable academic edge.',
  },
  premium: {
    name: 'Espeezy Premium',
    price: 'GBP 14.99',
    period: '/month',
    badge: 'Power Users',
    hasTrial: true,
    features: [
      'Everything in Pro',
      'Advanced AI Study Coach access',
      'Group health score and intervention suggestions',
      'High-depth contribution analytics',
      'Academic integrity reports',
      'Advanced reporting and presentation-ready exports',
      'Priority support (48h SLA)',
      'Early access to new features',
    ],
    description: 'For team leads and high-intensity collaborators running larger, higher-stakes academic workflows.',
  },
  lifetime: {
    name: LIFETIME_PLAN_NAME,
    price: 'GBP 149.00',
    period: 'one-time',
    badge: 'First 100 lifetime seats',
    hasTrial: false,
    features: [...PREREG_LIFETIME_FEATURES],
    description: LIFETIME_PLAN_DESCRIPTION,
  },
} as const

const BRAND = '#6366f1'
const LIFETIME_LIMIT = 100

const TRUST = [
  { icon: <Lock size={14} />, label: 'SSL encrypted' },
  { icon: <ShieldCheck size={14} />, label: 'Powered by Stripe' },
  { icon: <Building2 size={14} />, label: 'No hidden fees' },
  { icon: <CheckCircle2 size={14} />, label: 'Cancel anytime' },
]

function CheckoutFlow() {
  const searchParams = useSearchParams()
  const planKey = getPlanKey(searchParams.get('plan'))
  const coupon = searchParams.get('coupon') ?? ''
  const userId = searchParams.get('uid') ?? ''

  const plan = PLANS[planKey] ?? PLANS.pro
  const [step, setStep] = useState<'review' | 'processing'>('review')
  const [hovered, setHovered] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const isProPlan = planKey === 'pro'
  const isLifetimePlan = planKey === 'lifetime'
  const [lifetimeSeatsUsed, setLifetimeSeatsUsed] = useState<number | null>(null)
  const [metricsUpdatedAt, setMetricsUpdatedAt] = useState<string>('')

  useEffect(() => {
    if (!isLifetimePlan) return

    let cancelled = false

    const refreshLifetimeSeats = async () => {
      try {
        const data = await fetchLiveMetrics()
        if (!data) return
        if (!cancelled && typeof data.lifetime_seats_used === 'number') {
          setLifetimeSeatsUsed(data.lifetime_seats_used)
          setMetricsUpdatedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
        }
      } catch {
        if (!cancelled) {
          setLifetimeSeatsUsed(null)
        }
      }
    }

    refreshLifetimeSeats()
    const interval = setInterval(refreshLifetimeSeats, 30_000)
    const onFocus = () => {
      refreshLifetimeSeats()
    }

    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [isLifetimePlan])

  const isLifetimeSoldOut = isLifetimePlan && lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= LIFETIME_LIMIT
  const lifetimeSeatsLeft = isLifetimePlan && lifetimeSeatsUsed !== null
    ? Math.max(0, LIFETIME_LIMIT - lifetimeSeatsUsed)
    : null

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const handlePay = async () => {
    if (isLifetimeSoldOut) return

    // Validate email
    if (!validateEmail(email)) return

    setStep('processing')
    
    try {
      const result = await createStripeCheckout({
        plan: planKey,
        email: email.trim().toLowerCase(),
        prefilled_promo_code: coupon || undefined,
      })

      if (!result.ok || !result.url) {
        console.error('Checkout error:', result.error)
        setStep('review')
        setEmailError(result.error ?? 'Unable to start checkout. Please try again.')
        return
      }

      window.location.href = result.url
    } catch (error) {
      console.error('Checkout error:', error)
      setStep('review')
      setEmailError('Network error. Please check your connection and try again.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      backgroundImage: 'radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5rem 2rem 2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Nav */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: BRAND, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ color: '#0f172a', fontWeight: 950, fontSize: '0.9rem', letterSpacing: '-0.03em' }}>Espeezy</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'rgba(15,23,42,0.4)', fontWeight: 600 }}>
          <Lock size={12} />
          Secure checkout
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'review' ? (
          <motion.div key="review" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12, scale: 0.97 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 10 }}>

            {/* "One more step" pill */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '6px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '100px' }}>
                <Sparkles size={12} color={BRAND} />
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.15em' }}>One more step</span>
              </div>
            </div>

            {/* 14-day free trial banner (subscription plans only) */}
            {plan.hasTrial && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '14px', marginBottom: '1rem' }}>
                <Gift size={16} color={BRAND} style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>14-day free trial · No credit card required</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)', fontWeight: 500, marginTop: '1px' }}>Start free. Cancel anytime before the trial ends and pay absolutely nothing.</span>
                </div>
              </motion.div>
            )}

            {isProPlan && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                <Sparkles size={16} color={BRAND} style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Pro is the main paid plan</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(15,23,42,0.55)', fontWeight: 500, marginTop: '1px' }}>Premium is for heavier workflows later. Pro is the cleanest starting point for most students.</span>
                </div>
              </motion.div>
            )}

            {isLifetimePlan && lifetimeSeatsUsed !== null && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  padding: '0.75rem 1.25rem',
                  background: isLifetimeSoldOut ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                  border: isLifetimeSoldOut ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(16,185,129,0.18)',
                  borderRadius: '14px',
                  marginBottom: '1rem',
                }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                  {isLifetimeSoldOut
                    ? `All ${LIFETIME_LIMIT} lifetime seats have been claimed`
                    : `${lifetimeSeatsLeft} of ${LIFETIME_LIMIT} lifetime seats remaining`}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isLifetimeSoldOut ? '#dc2626' : '#059669',
                }}>
                  {isLifetimeSoldOut ? 'Sold Out' : 'Live'}
                </span>
              </motion.div>
            )}

            {isLifetimePlan && metricsUpdatedAt && (
              <p style={{ margin: '0 0 1rem', textAlign: 'center', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                Live Supabase count · updated {metricsUpdatedAt}
              </p>
            )}

            {/* Card */}
            <div style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.04)' }}>
              {/* Header */}
              <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>{plan.badge}</div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{plan.name}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>
                      <span style={{ fontSize: '2rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.04em' }}>{plan.price}</span>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.4)', fontWeight: 600 }}>{plan.period}</span>
                    </div>
                    {plan.hasTrial && (
                      <div style={{ fontSize: '0.68rem', color: BRAND, fontWeight: 700, marginTop: '2px' }}>after free trial</div>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(15,23,42,0.55)', lineHeight: 1.5 }}>{plan.description}</p>
              </div>

              {/* Features */}
              <div style={{ padding: '1.5rem 2rem' }}>
                <p style={{ margin: '0 0 1rem', fontSize: '0.68rem', fontWeight: 800, color: 'rgba(15,23,42,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>What you get</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '20px', height: '20px', background: 'rgba(99,102,241,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={12} color={BRAND} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.75)', fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div style={{ padding: '0 2rem 2rem' }}>
                {/* Email input */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    onBlur={() => {
                      if (email) validateEmail(email)
                    }}
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: emailError ? '1px solid #dc2626' : '1px solid rgba(15,23,42,0.1)',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      background: emailError ? 'rgba(220, 38, 38, 0.03)' : '#f8fafc',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  {emailError && (
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#dc2626', fontWeight: 500 }}>
                      {emailError}
                    </p>
                  )}
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'rgba(15,23,42,0.4)', fontWeight: 500 }}>
                    We'll use this to create your Espeezy account
                  </p>
                </div>

                <motion.button
                  onClick={handlePay}
                  disabled={isLifetimeSoldOut}
                  onHoverStart={() => setHovered(true)}
                  onHoverEnd={() => setHovered(false)}
                  whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', padding: '1.1rem', background: isLifetimeSoldOut ? '#94a3b8' : BRAND, border: 'none', borderRadius: '14px', color: 'white', fontSize: '0.95rem', fontWeight: 800, cursor: isLifetimeSoldOut ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: isLifetimeSoldOut ? 'none' : `0 8px 24px rgba(99,102,241,0.3)`, letterSpacing: '-0.01em' }}>
                  <CreditCard size={18} />
                  {isLifetimeSoldOut ? 'Lifetime seats sold out' : plan.hasTrial ? 'Start your 14-day free trial' : 'Continue to secure payment'}
                  <motion.span animate={{ x: hovered ? 4 : 0 }} transition={{ duration: 0.15 }}>
                    <ArrowRight size={16} />
                  </motion.span>
                </motion.button>

                {isLifetimeSoldOut && (
                  <p style={{ textAlign: 'center', margin: '0.6rem 0 0', fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                    This offer is permanently closed after the first 100 supporters.
                  </p>
                )}

                {plan.hasTrial && (
                  <p style={{ textAlign: 'center', margin: '0.6rem 0 0', fontSize: '0.72rem', color: 'rgba(15,23,42,0.4)', fontWeight: 500 }}>
                    Then {plan.price}{plan.period}. Cancel anytime before trial ends.
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {TRUST.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'rgba(15,23,42,0.35)', fontWeight: 600 }}>
                      {t.icon}
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: 'rgba(15,23,42,0.35)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                ← Go back
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'rgba(15,23,42,0.45)', fontSize: '0.72rem', lineHeight: 1.55, fontWeight: 600, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              {CHECKOUT_TEAM_NOTE}
            </p>
            <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', color: 'rgba(15,23,42,0.3)', fontSize: '0.75rem', fontWeight: 600 }}>
              <Users size={13} />
              <span>{isProPlan ? 'Most students should start with Pro' : 'Upgrade when your workflow needs more depth'}</span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', zIndex: 10 }}>
            <div style={{ width: '72px', height: '72px', background: 'rgba(99,102,241,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={36} color={BRAND} style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '1.1rem' }}>Redirecting to secure checkout…</p>
            <p style={{ margin: 0, color: 'rgba(15,23,42,0.4)', fontSize: '0.8rem' }}>You&apos;ll be back on Espeezy in moments.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutFlow />
    </Suspense>
  )
}
