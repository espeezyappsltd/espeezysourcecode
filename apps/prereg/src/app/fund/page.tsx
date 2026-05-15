'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import {
  Sparkles, Heart, Cpu, Globe, BookOpen,
  BarChart2, Smartphone, ShieldCheck, Lock,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react'
import { PLAN_PAYMENT_LINKS } from '@/lib/stripe-payment-links'
import { fetchLiveMetrics } from '@/services/launch'
import { createDonationCheckout, trackDonationClick } from '@/services/donations'

const FUND_FEATURES = [

  {
    icon: <Globe size={22} />,
    title: 'Free access to all platform features including kanban board and basic analytics features',
    need: '$3,000',
    tag: 'Localization',
    why: 'Free-tier hosting cannot support the global infrastructure and translation management needed to offer Espeezy in multiple languages. Dedicated budget is required for localization engineers, translators, and multi-region hosting.',
    deliverable: 'English, Spanish, French, and more.',
  },

  {
    icon: <BookOpen size={22} />,
    title: 'LMS Integration Layer (Canvas, Blackboard, Nile)',
    need: '$14,000',
    tag: 'Integrations',
    why: 'Official LTI 1.3 certification costs $3,500 per platform. Dedicated integration engineers, sandbox environments, and compliance audits for each LMS require real budget.',
    deliverable: 'One-click grade sync, single sign-on from your institution, automatic assignment import into Espeezy.',
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Mobile & Web Apps for Educators',
    need: '$6,000',
    tag: 'Mobile & Web',
    why: 'Free-tier hosting cannot support high-traffic mobile apps and web services. Dedicated mobile and web app engineers and infrastructure are required.',
    deliverable: 'One-click sign-in for educators, mobile app for students, and web service for educators and students.',
  },
  {
    icon: <Cpu size={22} />,
    title: 'AI Study Coach & Adaptive Learning Engine',
    need: '$28,000',
    tag: 'AI Infrastructure',
    why: 'Running GPT-4o inference at scale for 100,000+ concurrent students requires dedicated GPU compute, fine-tuned model hosting, and significant API budget. We cannot use free tiers for production AI at this scale.',
    deliverable: 'Personalised weekly study plans, real-time feedback on submissions, automatic workload balancing within groups.',
  },

  {
    icon: <Globe size={22} />,
    title: 'Global CDN & Multi-Region Infrastructure',
    need: '$22,000 / yr',
    tag: 'Infrastructure',
    why: 'Low-latency real-time collaboration for students in Southeast Asia, Africa, and Latin America demands edge nodes in those regions. Free-tier hosting cannot serve global traffic reliably.',
    deliverable: 'Sub-100ms response times worldwide, 99.99% uptime SLA, automatic failover.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Verified Digital Credentials & Blockchain Anchoring',
    need: '$18,500',
    tag: 'Trust & Verification',
    why: 'Issuing W3C-compliant Verifiable Credentials requires integration with credential registries, legal review for academic recognition, and smart contract deployment and auditing costs.',
    deliverable: 'Tamper-proof PDF and digital certificates students can share on LinkedIn, backed by a public blockchain record.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Live Analytics Dashboard for Educators',
    need: '$9,500',
    tag: 'Analytics',
    why: 'Processing contribution heatmaps, velocity graphs, and anomaly detection in real-time for classrooms of 200+ students demands dedicated data pipeline infrastructure beyond what serverless free tiers allow.',
    deliverable: 'Educators see every student\'s daily contribution level, flag free-rider patterns automatically, and export grade-ready reports in one click.',
  }
]

const PRESETS = [5, 10, 25, 50, 100, 250]

// Amount-specific Stripe links for direct checkout (preferred for preset buttons)
const DONATION_PAYMENT_LINKS: Record<number, string> = {
  5: (process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK_5 ?? 'https://donate.stripe.com/00w8wPbhO16wfdufa07wA08').trim(),
  10: (process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK_10 ?? 'https://donate.stripe.com/aFacN55Xu5mM6GYbXO7wA09').trim(),
  15: (process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK_15 ?? 'https://donate.stripe.com/00wdR91He02s5CU5zq7wA0a').trim(),
  25: (process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK_25 ?? 'https://donate.stripe.com/5kQdR92Li5mM9Ta1ja7wA0b').trim(),
  50: (process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK_50 ?? 'https://donate.stripe.com/aFa8wP0Da7uU0iA6Du7wA0c').trim(),
  100: (process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK_100 ?? 'https://donate.stripe.com/dRm6oH3Pm9D23uM1ja7wA0d').trim(),
}

const TESTIMONIALS = [
  { name: 'Sr Lec, Amir Minai., University of Northampton', text: 'Espeezy is what I have been waiting for: a tool that actually sees my students as individuals, not just a group grade.' },
  { name: 'Qualified Nurse. Joel K., University of Northampton', text: 'I was the one always carrying the team. This platform finally makes that visible. 100% worth supporting.' },
  { name: 'Software Engineer. Mike T., Computer Science, University of Northampton', text: 'The integrations roadmap alone is worth backing. Every educator needs this layer between students and the LMS.' },
]

function getDonationFallbackLink(amount?: number, email?: string) {
  const base = (amount ? DONATION_PAYMENT_LINKS[amount] : null)
    || process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK?.trim()
    || null

  if (!base) return null
  if (!email?.trim()) return base

  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}prefilled_email=${encodeURIComponent(email.trim())}`
}

export default function FundPage() {
  const [customAmount, setCustomAmount] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [message, setMessage] = useState('')
  const [featureTag, setFeatureTag] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null)

  const getOrCreateActorKey = useCallback(() => {
    if (typeof window === 'undefined') return ''
    const existing = window.localStorage.getItem('espeezy_donate_actor_key')
    if (existing) return existing
    const next = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem('espeezy_donate_actor_key', next)
    return next
  }, [])

  const trackDonateClick = useCallback((params: { amountCents: number; context: string; featureTag?: string }) => {
    const actorKey = getOrCreateActorKey()
    const payload = {
      amountCents: params.amountCents,
      source: 'fund_page',
      featureTag: params.featureTag || featureTag || undefined,
      context: params.context,
      actorKey,
    }

    trackDonationClick(payload)
  }, [featureTag, getOrCreateActorKey])

  const getFinalAmount = () => {
    if (selectedPreset) return selectedPreset * 100
    const parsed = parseFloat(customAmount)
    if (!isNaN(parsed) && parsed >= 1) return Math.round(parsed * 100)
    return 0
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    const amountCents = getFinalAmount()
    if (amountCents < 100) { setSubmitError('Minimum donation is £1.00'); return }

    trackDonateClick({ amountCents, context: 'donate_form_submit', featureTag: featureTag || undefined })

    // For preset tiers, use direct Stripe payment links first (no API dependency).
    if (selectedPreset && selectedPreset >= 5 && selectedPreset <= 100) {
      const directLink = getDonationFallbackLink(selectedPreset, donorEmail)
      if (directLink) {
        window.location.href = directLink
        return
      }
    }

    setSubmitting(true)

    // Try the Stripe Checkout Sessions API first
    try {
      const result = await createDonationCheckout({ amountCents, donorName, donorEmail, message, featureTag: featureTag || 'general', isAnonymous })
      if (result.ok && result.url) {
        window.location.href = result.url
        return
      }
      // If API is unavailable (Stripe not configured) fall back to Payment Link
      const paymentLink = getDonationFallbackLink(selectedPreset ?? undefined, donorEmail)
      if (paymentLink) {
        window.location.href = paymentLink
        return
      }
      setSubmitError(result.error ?? 'Failed to start checkout. Please try again.')
    } catch {
      const paymentLink = getDonationFallbackLink(selectedPreset ?? undefined, donorEmail)
      if (paymentLink) {
        window.location.href = paymentLink
        return
      }
      setSubmitError('Network error. Please check your connection.')
    }
    setSubmitting(false)
  }

  const displayAmount = getFinalAmount() / 100

  return (
    <MotionConfig reducedMotion="user">
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>

        {/* Dot-grid overlay */}
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />
        {/* Gradient blobs */}
        <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Nav */}
        <nav aria-label="Primary navigation" style={{ position: 'sticky', top: 0, zIndex: 1000, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1rem, 4vw, 2.5rem)', borderBottom: '1px solid rgba(15,23,42,0.07)', backdropFilter: 'blur(16px)', backgroundColor: 'rgba(255,255,255,0.9)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/brand_logo2.svg" width={22} height={22} style={{ objectFit: 'contain' }} alt="" aria-hidden="true" priority />
            </div>
            <span style={{ fontWeight: 950, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.03em' }}>Espeezy</span>
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/" style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(15,23,42,0.55)', textDecoration: 'none' }}>Pre-Register</Link>
            <Link href="/pricing" style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(15,23,42,0.55)', textDecoration: 'none' }}>Pricing</Link>
            <a href="#donate-form" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: 'var(--brand)', fontSize: '0.8rem', fontWeight: 800, color: 'white', textDecoration: 'none' }}>Accelerate</a>
          </div>
        </nav>

        <section style={{ padding: 'clamp(4rem, 10vw, 7rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '7px 18px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', marginBottom: '2rem' }}>
              <Heart size={14} color="#10b981" />
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Platform Acceleration</span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, maxWidth: '800px', margin: '0 auto 1.5rem', color: '#0f172a' }}>
            Accelerate the future of{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              collaborative learning.
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}
            style={{ color: '#64748b', maxWidth: '620px', margin: '0 auto 1rem', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', lineHeight: 1.65, fontWeight: 500 }}>
            We are building the infrastructure for a more transparent academic world. Direct your resources toward the milestones that matter most to your team. 100% of contributions are deployed to engineering and global infrastructure.
          </motion.p>
        </section>

        <section style={{ padding: '0 clamp(1rem, 4vw, 2.5rem) clamp(5rem, 8vw, 7rem)', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>

            <div id="donate-form" style={{ position: 'sticky', top: '84px' }}>
              <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '20px', padding: 'clamp(1.75rem, 4vw, 2.5rem)', boxShadow: '0 4px 24px rgba(15,23,42,0.08)' }}>
                <div style={{ marginBottom: '0.5rem', display: 'inline-flex', padding: '4px 12px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '100px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Secure Payment via Stripe</span>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 950, letterSpacing: '-0.04em', margin: '0.875rem 0 0.5rem', lineHeight: 1.1, color: '#0f172a' }}>
                  Fuel the build.<br />
                  <span style={{ color: '#10b981' }}>Select your contribution level.</span>
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: 1.55, marginBottom: '1.75rem' }}>
                  Deploy resources directly to the feature roadmap.
                </p>

                <form onSubmit={handleDonate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.625rem' }}>Choose amount</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {PRESETS.map(p => (
                        <button key={p} type="button"
                          onClick={() => { setSelectedPreset(p); setCustomAmount('') }}
                          style={{ padding: '0.625rem', borderRadius: '8px', border: `1px solid ${selectedPreset === p ? 'var(--brand)' : 'rgba(15,23,42,0.12)'}`, background: selectedPreset === p ? 'rgba(99,102,241,0.08)' : 'white', color: selectedPreset === p ? 'var(--brand)' : '#475569', fontWeight: 750, fontSize: '0.9rem', cursor: 'pointer' }}>
                          ${p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>$</span>
                    <input type="number" min="1" step="0.01" placeholder="Custom amount" value={customAmount}
                      onChange={e => { setCustomAmount(e.target.value); setSelectedPreset(null) }}
                      style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2rem', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.12)', background: '#f8fafc', color: '#0f172a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <select value={featureTag} onChange={e => setFeatureTag(e.target.value)}
                    style={{ padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.12)', background: '#f8fafc', color: '#475569', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Accelerate the general build</option>
                    {FUND_FEATURES.map(f => <option key={f.title} value={f.title}>{f.title}</option>)}
                  </select>

                  <input type="text" placeholder="Your name (optional)" value={donorName} onChange={e => setDonorName(e.target.value)}
                    style={{ padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.10)', background: '#f8fafc', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }} />
                  <input type="email" placeholder="Email for receipt (optional)" value={donorEmail} onChange={e => setDonorEmail(e.target.value)}
                    style={{ padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.10)', background: '#f8fafc', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }} />
                  <textarea placeholder="Leave a message (optional)" value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    style={{ padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.10)', background: '#f8fafc', color: '#0f172a', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand)', cursor: 'pointer' }} />
                    Make my contribution anonymous
                  </label>

                  {submitError && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '0.85rem' }}>
                      {submitError}
                    </div>
                  )}

                  <button type="submit" disabled={submitting || displayAmount < 1}
                    style={{ padding: '1rem', borderRadius: '10px', background: displayAmount >= 1 ? 'var(--brand)' : '#e2e8f0', color: displayAmount >= 1 ? 'white' : '#94a3b8', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: displayAmount >= 1 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.15s' }}>
                    {submitting ? 'Redirecting to Stripe…' : displayAmount >= 1 ? `Contribute $${displayAmount.toFixed(2)} →` : 'Select an amount'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Lock size={12} color="#cbd5e1" />
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Secured by Stripe · 256-bit SSL encryption</span>
                  </div>
                </form>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem', color: '#0f172a' }}>Milestone Roadmap</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>Transparency is our core. Select a milestone below to view its technical requirements and deployment plan.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {FUND_FEATURES.map((f, i) => (
                  <div key={i}
                    style={{ border: `1px solid ${expandedFeature === i ? 'rgba(99,102,241,0.3)' : 'rgba(15,23,42,0.08)'}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', background: expandedFeature === i ? 'rgba(99,102,241,0.03)' : 'white', boxShadow: expandedFeature === i ? '0 0 0 1px rgba(99,102,241,0.15)' : '0 1px 3px rgba(15,23,42,0.04)' }}
                    onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ color: 'var(--brand)', opacity: 0.8, flexShrink: 0 }}>{f.icon}</div>
                        <div>
                          <div style={{ fontWeight: 750, fontSize: '0.9rem', color: '#0f172a' }}>{f.title}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{f.tag}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>{f.need}</span>
                        {expandedFeature === i ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedFeature === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                          <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(15,23,42,0.07)' }}>
                            <div style={{ marginTop: '1rem' }}>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, marginBottom: '0.875rem' }}>
                                <strong style={{ color: '#475569', display: 'block', marginBottom: '0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Technical Requirements</strong>
                                {f.why}
                              </p>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                                <strong style={{ color: '#059669', display: 'block', marginBottom: '0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>What it delivers</strong>
                                {f.deliverable}
                              </p>
                            </div>
                            <button onClick={e => { e.stopPropagation(); setFeatureTag(f.title); document.getElementById('donate-form')?.scrollIntoView({ behavior: 'smooth' }) }}
                              style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--brand)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                              Fund this milestone <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: 'clamp(4rem, 8vw, 6rem) clamp(1rem, 4vw, 2.5rem)', borderTop: '1px solid rgba(15,23,42,0.07)', position: 'relative', zIndex: 1, background: '#f8fafc' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '3rem', color: '#0f172a' }}>What people are saying</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  style={{ padding: '1.75rem', background: 'white', border: '1px solid rgba(15,23,42,0.07)', borderRadius: '14px', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                    {[...Array(5)].map((_, s) => <span key={s} style={{ color: '#10b981', fontSize: '14px' }}>★</span>)}
                  </div>
                  <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem', fontStyle: 'italic' }}>&quot;{t.text}&quot;</p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{t.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2.5rem)', borderTop: '1px solid rgba(15,23,42,0.07)', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '2.5rem', color: '#0f172a' }}>Frequently asked</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { q: 'Is Espeezy really free?', a: 'Yes. The core platform (group workspaces, kanban boards, roadmaps, peer network) is free forever for all students. Premium features (AI coach, analytics, credentials) are funded by this campaign and Pro subscriptions.' },
                { q: 'Where does my donation go?', a: 'Directly to engineering. No salaries, no office, no marketing. Every dollar is tracked against the feature roadmap above and reported back to supporters monthly.' },
                { q: 'Can I get a receipt?', a: 'Yes. Enter your email in the form and Stripe will send a receipt automatically. For corporate/institutional donations requiring an invoice, email support@espeezy.com.' },
                { q: 'What if the goal is not reached?', a: "Donations are non-refundable. If a specific feature's goal is not met, funds roll into general infrastructure which benefits all features." },
              ].map((faq, i) => (
                <div key={i} style={{ padding: '1.25rem', background: 'white', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '12px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                  <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{faq.q}</p>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer style={{ borderTop: '1px solid rgba(15,23,42,0.07)', padding: '2rem clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, background: '#f8fafc' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={13} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#475569' }}>Espeezy</span>
            </Link>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {[['/', 'Home'], ['/pricing', 'Pricing'], ['/terms', 'Terms'], ['/privacy', 'Privacy']].map(([href, label]) => (
                <Link key={href} href={href} style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>{label}</Link>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: 0 }}>© {new Date().getFullYear()} Espeezy</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}
