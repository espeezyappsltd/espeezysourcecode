'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Sparkles, Lock, CheckCircle2, ArrowRight, Loader2,
  Users, CreditCard, Building2, Gift
} from 'lucide-react'
import Link from 'next/link'

const PLANS = {
  pro: {
    name: 'Pro Scholar',
    price: '$9',
    period: '/month',
    badge: 'Most Popular',
    hasTrial: true,
    stripeLink: 'https://buy.stripe.com/5kQcN5clSbLa5CU0f67wA04',
    features: [
      'Unlimited group workspaces',
      'AI Study Coach (100 queries/month)',
      'Priority task assignment',
      'Verified contributor badge',
      'Real-time co-editing',
      'Stripe earnings payout',
    ],
    description: 'For serious students who want to maximise every collaboration session.',
  },
  premium: {
    name: 'Premium Scholar',
    price: '$19',
    period: '/month',
    badge: 'Best Value',
    hasTrial: true,
    stripeLink: 'https://buy.stripe.com/00wcN55Xu16w4yQe5W7wA06',
    features: [
      'Everything in Pro',
      'Unlimited AI queries',
      'Academic integrity reports',
      'Custom group branding',
      'Priority support (48h SLA)',
      'Annual digital certificate',
      'Early access to new features',
    ],
    description: 'For team leads and students who need every edge available.',
  },
  lifetime: {
    name: 'Lifetime Founding Scholar',
    price: '$149',
    period: 'one-time',
    badge: 'Limited: 100 seats',
    hasTrial: false,
    stripeLink: 'https://buy.stripe.com/8x2aEXdpWbLa1mEge47wA05',
    features: [
      'Everything in Premium, forever',
      'Founding Scholar badge',
      'All future features included',
      'Direct roadmap input',
      'Blockchain-anchored certificate',
      'Priority institutional onboarding',
    ],
    description: 'Secure your seat before the community grows. No renewal, ever.',
  },
} as const

type PlanKey = keyof typeof PLANS

const BRAND = '#6366f1'

const TRUST = [
  { icon: <Lock size={14} />, label: 'SSL encrypted' },
  { icon: <ShieldCheck size={14} />, label: 'Powered by Stripe' },
  { icon: <Building2 size={14} />, label: 'No hidden fees' },
  { icon: <CheckCircle2 size={14} />, label: 'Cancel anytime' },
]

function CheckoutFlow() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planKey = (searchParams.get('plan') ?? 'pro') as PlanKey
  const coupon = searchParams.get('coupon') ?? ''
  const userId = searchParams.get('uid') ?? ''

  const plan = PLANS[planKey] ?? PLANS.pro
  const [step, setStep] = useState<'review' | 'processing'>('review')
  const [hovered, setHovered] = useState(false)

  const handlePay = () => {
    setStep('processing')
    const params = new URLSearchParams()
    if (userId) params.set('client_reference_id', userId)
    if (coupon) params.set('prefilled_promo_code', coupon)
    const qs = params.toString()
    window.location.href = `${plan.stripeLink}${qs ? `?${qs}` : ''}`
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
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>14-day free trial, no charge today</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)', fontWeight: 500, marginTop: '1px' }}>Cancel anytime before the trial ends and pay nothing.</span>
                </div>
              </motion.div>
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
                <motion.button
                  onClick={handlePay}
                  onHoverStart={() => setHovered(true)}
                  onHoverEnd={() => setHovered(false)}
                  whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', padding: '1.1rem', background: BRAND, border: 'none', borderRadius: '14px', color: 'white', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: `0 8px 24px rgba(99,102,241,0.3)`, letterSpacing: '-0.01em' }}>
                  <CreditCard size={18} />
                  {plan.hasTrial ? 'Start your 14-day free trial' : 'Continue to secure payment'}
                  <motion.span animate={{ x: hovered ? 4 : 0 }} transition={{ duration: 0.15 }}>
                    <ArrowRight size={16} />
                  </motion.span>
                </motion.button>

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
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(15,23,42,0.35)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                ← Go back
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'rgba(15,23,42,0.3)', fontSize: '0.75rem', fontWeight: 600 }}>
              <Users size={13} />
              <span>Join thousands of students already on Espeezy</span>
            </div>
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
