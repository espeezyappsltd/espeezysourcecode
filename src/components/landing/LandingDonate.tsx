'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Heart, Lock, Sparkles, Zap, Coffee, Star } from 'lucide-react'
import Link from 'next/link'
import { createDonationCheckout } from '@/services/donations'

const PRESETS = [5, 10, 25, 50]

const IMPACT_STATS = [
  { icon: <Zap size={14} />, label: 'Features shipped', value: '47+' },
  { icon: <Heart size={14} />, label: 'Students served', value: '12,000+' },
  { icon: <Coffee size={14} />, label: 'Late-night commits', value: '∞' },
]

const ambientGlowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '700px',
  height: '400px',
  background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)',
  filter: 'blur(60px)',
  pointerEvents: 'none',
}

export default function LandingDonate() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10)
  const [customAmount, setCustomAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  const getFinalAmount = () => {
    if (selectedPreset) return selectedPreset * 100
    const parsed = parseFloat(customAmount)
    if (!isNaN(parsed) && parsed >= 1) return Math.round(parsed * 100)
    return 0
  }

  const displayAmount = getFinalAmount() / 100

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    const amountCents = getFinalAmount()
    if (amountCents < 100) {
      setSubmitError('Minimum donation is $1.00')
      return
    }
    setSubmitting(true)
    try {
      const url = await createDonationCheckout({ amountCents, featureTag: 'general', isAnonymous: false })
      window.location.href = url
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection.'
      setSubmitError(message)
    }
    setSubmitting(false)
  }

  return (
    <section
      ref={sectionRef}
      id="support"
      style={{
        padding: 'clamp(5rem, 12vw, 9rem) clamp(1rem, 4vw, 2.5rem)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={ambientGlowStyle} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '7px 18px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '100px', marginBottom: '1.5rem' }}>
            <Heart size={13} color="var(--brand)" />
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Keep Espeezy Alive</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '1.25rem' }}>
            Real infrastructure.<br />
            <span style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #34d399 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Real costs. Real impact.
            </span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '580px', margin: '0 auto', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', lineHeight: 1.65 }}>
            Espeezy is free for every student — and keeping it that way demands servers, APIs, and engineers who don&apos;t sleep. Even $5 keeps a feature running for a month. <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Your $5 matters more than you think.</strong>
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>

          {/* Left — social proof + stats */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {/* Impact stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {IMPACT_STATS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                >
                  <div style={{ color: 'var(--brand)', opacity: 0.7 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.03em', color: 'white' }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Manifesto card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.55, duration: 0.6 }}
              style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '14px' }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="var(--brand)" color="var(--brand)" />)}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 0.75rem' }}>
                &quot;Espeezy replaced three separate tools for my team. The transparency alone is worth every penny — finally, group work that&apos;s actually fair.&quot;
              </p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>— Kenji T., Computer Science, Tokyo</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7, duration: 0.5 }}
              style={{ marginTop: '1.25rem', textAlign: 'center' }}
            >
              <Link href="/fund" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1px' }}>
                See the full funding roadmap →
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — donation form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: 'clamp(1.5rem, 4vw, 2.25rem)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '4px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '100px', marginBottom: '1.25rem' }}>
                <Sparkles size={10} color="var(--brand)" />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Secure · Stripe</span>
              </div>

              <h3 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.65rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                Keep the lights on.<br />
                <span style={{ color: 'var(--brand)' }}>Any amount. Right now.</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                100% goes to engineering and infrastructure. No admin overhead. No middle men.
              </p>

              <form onSubmit={handleDonate} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Preset buttons */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {PRESETS.map(p => (
                      <motion.button
                        key={p}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { setSelectedPreset(p); setCustomAmount('') }}
                        style={{
                          padding: '0.7rem 0.25rem',
                          borderRadius: '10px',
                          border: `1px solid ${selectedPreset === p ? 'var(--brand)' : 'rgba(255,255,255,0.1)'}`,
                          background: selectedPreset === p ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                          color: selectedPreset === p ? 'var(--brand)' : 'rgba(255,255,255,0.5)',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        ${p}
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div style={{ position: 'relative' }}>
                    <label
                      htmlFor="custom-donation-amount"
                      style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
                    >
                      Custom donation amount in US dollars
                    </label>
                    <span aria-hidden="true" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.9rem' }}>$</span>
                    <input
                      id="custom-donation-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={e => { setCustomAmount(e.target.value); setSelectedPreset(null) }}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {submitError && (
                  <div style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.8rem' }}>
                    {submitError}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={submitting || displayAmount < 1}
                  whileHover={displayAmount >= 1 && !submitting ? { scale: 1.01, boxShadow: '0 12px 40px rgba(16,185,129,0.3)' } : {}}
                  whileTap={displayAmount >= 1 && !submitting ? { scale: 0.98 } : {}}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: displayAmount >= 1 ? 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                    color: displayAmount >= 1 ? 'white' : 'rgba(255,255,255,0.2)',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: displayAmount >= 1 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.2s',
                    letterSpacing: '-0.01em',
                    boxShadow: displayAmount >= 1 ? '0 8px 24px rgba(16,185,129,0.2)' : 'none',
                  }}
                >
                  {submitting
                    ? 'Redirecting to Stripe…'
                    : displayAmount >= 1
                      ? <><Heart size={14} fill="white" />  Donate ${displayAmount.toFixed(2)} — it means everything</>
                      : 'Choose an amount above'}
                </motion.button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Lock size={11} color="rgba(255,255,255,0.2)" />
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>256-bit SSL · Secured by Stripe</span>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
