'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, Heart, CheckCircle, Cpu, Globe, BookOpen,
  Shield, Zap, Award, BarChart2, Smartphone, ShieldCheck, Lock,
  ChevronDown, ChevronUp, DollarSign, Users
} from 'lucide-react'

// ─── Features that need funding ───────────────────────────────────────────────
const FUND_FEATURES = [
  {
    icon: <Cpu size={22} />,
    title: 'AI Study Coach & Adaptive Learning Engine',
    need: '$28,000',
    tag: 'AI Infrastructure',
    why: 'Running GPT-4o inference at scale for 100,000+ concurrent students requires dedicated GPU compute, fine-tuned model hosting, and significant API budget. We cannot use free tiers for production AI at this scale.',
    deliverable: 'Personalised weekly study plans, real-time feedback on submissions, automatic workload balancing within groups.',
  },
  {
    icon: <BookOpen size={22} />,
    title: 'LMS Integration Layer (Canvas, Blackboard, Nile)',
    need: '$14,000',
    tag: 'Integrations',
    why: 'Official LTI 1.3 certification costs $3,500 per platform. Dedicated integration engineers, sandbox environments, and compliance audits for each LMS (Canvas, Blackboard, Moodle, Nile) require real budget.',
    deliverable: 'One-click grade sync, single sign-on from your institution, automatic assignment import into Espeezy.',
  },
  {
    icon: <Globe size={22} />,
    title: 'Global CDN & Multi-Region Infrastructure',
    need: '$22,000 / yr',
    tag: 'Infrastructure',
    why: 'Low-latency real-time collaboration for students in Southeast Asia, Africa, and Latin America demands edge nodes in those regions. Current free-tier hosting cannot serve global traffic reliably.',
    deliverable: 'Sub-100ms response times worldwide, 99.99% uptime SLA, automatic failover.',
  },
  {
    icon: <Award size={22} />,
    title: 'Verified Digital Credentials & Blockchain Anchoring',
    need: '$18,500',
    tag: 'Trust & Verification',
    why: 'Issuing W3C-compliant Verifiable Credentials requires integration with credential registries, legal review for academic recognition, and smart contract deployment and auditing costs.',
    deliverable: 'Tamper-proof PDF and digital certificates students can share on LinkedIn and attach to job applications — backed by a public blockchain record.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Live Analytics Dashboard for Educators',
    need: '$9,500',
    tag: 'Analytics',
    why: 'Processing contribution heatmaps, velocity graphs, and anomaly detection in real-time for classrooms of 200+ students demands dedicated data pipeline infrastructure beyond what serverless free tiers allow.',
    deliverable: "Educators see every student's daily contribution level, flag free-rider patterns automatically, and export grade-ready reports in one click.",
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Native iOS & Android Applications',
    need: '$35,000',
    tag: 'Mobile',
    why: 'Apple Developer Program ($99/yr), Google Play ($25 once), but more critically — native app development, code signing, TestFlight cycles, and App Store review processes require dedicated engineering sprints and device testing budgets.',
    deliverable: 'Full Espeezy experience on mobile with push notifications, offline mode, camera document capture, and real-time sync.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Academic Integrity & Plagiarism Engine',
    need: '$12,000',
    tag: 'Integrity',
    why: 'Licensing AI models for similarity detection, maintaining an updated academic paper corpus, and achieving the accuracy required to be used as admissible evidence in academic proceedings requires serious infrastructure investment.',
    deliverable: 'Tamper-proof contribution logs, AI-assisted integrity checks, and auditable records that can be presented in academic misconduct hearings.',
  },
  {
    icon: <Users size={22} />,
    title: 'Enterprise & Institutional Onboarding Program',
    need: '$16,000',
    tag: 'Scale',
    why: 'Onboarding a university with 20,000 students requires SSO configuration, IT security review, data processing agreements (DPAs), FERPA/GDPR compliance certification, and dedicated support staff during rollout.',
    deliverable: 'Scalable institutional rollout process that lets us on-board a new university in under 2 weeks rather than 6 months.',
  },
]

// ─── Preset amounts ───────────────────────────────────────────────────────────
const PRESETS = [5, 10, 25, 50, 100, 250]

// ─── Donor testimonials (placeholder) ────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Dr. Amara N., University of Lagos', text: 'Espeezy is what I have been waiting for — a tool that actually sees my students as individuals, not just a group grade.' },
  { name: 'Kenji T., Computer Science, Tokyo', text: 'I was the one always carrying the team. This platform finally makes that visible. 100% worth supporting.' },
  { name: 'Sofia M., Education Technology, Barcelona', text: 'The integrations roadmap alone is worth backing. Every educator needs this layer between students and the LMS.' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
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
  const [donationTotal, setDonationTotal] = useState({ total_cents: 0, count: 0 })

  useEffect(() => {
    fetch('/api/donations/total')
      .then(r => r.json())
      .then(d => { if (d.total_cents !== undefined) setDonationTotal(d) })
      .catch(() => {})
  }, [])

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
    if (amountCents < 100) {
      setSubmitError('Minimum donation is $1.00')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/stripe/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, donorName, donorEmail, message, featureTag: featureTag || 'general', isAnonymous }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setSubmitError(data.error ?? 'Failed to start checkout. Please try again.')
      } else {
        window.location.href = data.url
      }
    } catch (_) {
      setSubmitError('Network error. Please check your connection.')
    }
    setSubmitting(false)
  }

  const displayAmount = getFinalAmount() / 100

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', overflowX: 'hidden' }}>

      {/* Grid overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(16,185,129,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '-15%', right: '-5%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1rem, 4vw, 2.5rem)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', backgroundColor: 'rgba(10,10,10,0.85)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontWeight: 950, fontSize: '1rem', color: 'white', letterSpacing: '-0.03em' }}>Espeezy</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/preregister" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Pre-Register</Link>
          <Link href="/" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Home</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(4rem, 10vw, 7rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '7px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', marginBottom: '2rem' }}>
            <Heart size={14} color="var(--brand)" />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Mission Support Fund</span>
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, maxWidth: '800px', margin: '0 auto 1.5rem' }}>
          Help us build the future of<br />
          <span style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #34d399 60%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            free education.
          </span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}
          style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '620px', margin: '0 auto 3rem', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', lineHeight: 1.65 }}>
          Espeezy is free for every student — always. But building world-class infrastructure, AI features, and institutional integrations requires real resources. Every contribution, however small, directly ships features.
        </motion.p>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ padding: '0.875rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 950, letterSpacing: '-0.04em', color: 'white' }}>
              ${(donationTotal.total_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Raised so far</div>
          </div>
          <div style={{ padding: '0.875rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 950, letterSpacing: '-0.04em', color: 'white' }}>{donationTotal.count.toLocaleString()}</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Supporters</div>
          </div>
          <div style={{ padding: '0.875rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 950, letterSpacing: '-0.04em', color: 'var(--brand)' }}>100%</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Goes to development</div>
          </div>
        </div>
      </section>

      {/* Main content: feature list + form */}
      <section style={{ padding: '0 clamp(1rem, 4vw, 2.5rem) clamp(5rem, 8vw, 7rem)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>

          {/* Left: Feature list */}
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>
              What your support builds
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              These are real costs. Click any feature to see exactly what the money is for.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {FUND_FEATURES.map((f, i) => (
                <div key={i}
                  style={{ border: `1px solid ${expandedFeature === i ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s', cursor: 'pointer', background: expandedFeature === i ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.015)' }}
                  onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{ color: 'var(--brand)', opacity: 0.7, flexShrink: 0 }}>{f.icon}</div>
                      <div>
                        <div style={{ fontWeight: 750, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>{f.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{f.tag}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand)' }}>{f.need}</span>
                      {expandedFeature === i ? <ChevronUp size={14} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.3)" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedFeature === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '0.875rem' }}>
                              <strong style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Why it costs money</strong>
                              {f.why}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
                              <strong style={{ color: 'var(--brand)', display: 'block', marginBottom: '0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>What it delivers</strong>
                              {f.deliverable}
                            </p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setFeatureTag(f.title); document.getElementById('donate-form')?.scrollIntoView({ behavior: 'smooth' }) }}
                            style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--brand)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                            Support this feature →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Donation form */}
          <div id="donate-form" style={{ position: 'sticky', top: '84px' }}>
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: 'clamp(1.75rem, 4vw, 2.5rem)', backdropFilter: 'blur(20px)' }}>
              <div style={{ marginBottom: '0.5rem', display: 'inline-flex', padding: '4px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '100px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Secure Payment via Stripe</span>
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 950, letterSpacing: '-0.04em', margin: '0.875rem 0 0.5rem', lineHeight: 1.1 }}>
                Make a contribution.<br />
                <span style={{ color: 'var(--brand)' }}>Any amount. Any time.</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', lineHeight: 1.55, marginBottom: '1.75rem' }}>
                100% of donations go directly to engineering and infrastructure. No admin overhead.
              </p>

              <form onSubmit={handleDonate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Preset buttons */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.625rem' }}>Choose amount</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {PRESETS.map(p => (
                      <button key={p} type="button" onClick={() => { setSelectedPreset(p); setCustomAmount('') }}
                        style={{ padding: '0.625rem', borderRadius: '8px', border: `1px solid ${selectedPreset === p ? 'var(--brand)' : 'rgba(255,255,255,0.1)'}`, background: selectedPreset === p ? 'rgba(16,185,129,0.1)' : 'transparent', color: selectedPreset === p ? 'var(--brand)' : 'rgba(255,255,255,0.55)', fontWeight: 750, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                        ${p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom amount */}
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>$</span>
                  <input type="number" min="1" step="0.01" placeholder="Custom amount"
                    value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedPreset(null) }}
                    style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Feature tag */}
                <select value={featureTag} onChange={e => setFeatureTag(e.target.value)}
                  style={{ padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: '#111', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Support general development</option>
                  {FUND_FEATURES.map(f => <option key={f.title} value={f.title}>{f.title}</option>)}
                </select>

                <input type="text" placeholder="Your name (optional)" value={donorName} onChange={e => setDonorName(e.target.value)}
                  style={{ padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '0.85rem', outline: 'none' }} />
                <input type="email" placeholder="Email for receipt (optional)" value={donorEmail} onChange={e => setDonorEmail(e.target.value)}
                  style={{ padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '0.85rem', outline: 'none' }} />
                <textarea placeholder="Leave a message for the team (optional)" value={message} onChange={e => setMessage(e.target.value)} rows={3}
                  style={{ padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                  <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--brand)', cursor: 'pointer' }} />
                  Make my contribution anonymous
                </label>

                {submitError && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.85rem' }}>
                    {submitError}
                  </div>
                )}

                <button type="submit" disabled={submitting || displayAmount < 1}
                  style={{ padding: '1rem', borderRadius: '10px', background: displayAmount >= 1 ? 'var(--brand)' : 'rgba(255,255,255,0.06)', color: displayAmount >= 1 ? 'white' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: displayAmount >= 1 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.15s', letterSpacing: '-0.01em' }}>
                  {submitting ? 'Redirecting to Stripe…' : displayAmount >= 1 ? `Donate $${displayAmount.toFixed(2)} →` : 'Enter an amount'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Lock size={12} color="rgba(255,255,255,0.2)" />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Secured by Stripe · 256-bit SSL encryption</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: 'clamp(4rem, 8vw, 6rem) clamp(1rem, 4vw, 2.5rem)', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '3rem' }}>
            What people are saying
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: '1.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                  {[...Array(5)].map((_, s) => <span key={s} style={{ color: 'var(--brand)', fontSize: '14px' }}>★</span>)}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem', fontStyle: 'italic' }}>&quot;{t.text}&quot;</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={13} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Espeezy</span>
          </Link>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            © {new Date().getFullYear()} Espeezy · All rights reserved · <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link> · <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
