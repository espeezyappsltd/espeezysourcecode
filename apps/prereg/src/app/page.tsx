'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import {
  ArrowRight, CheckCircle, Users, Globe, ShieldCheck,
  BookOpen, Cpu, Zap, BarChart2, Mail,
  GraduationCap, TrendingUp, Heart, Award
} from 'lucide-react'
import { useLaunchData } from '@/hooks/useLaunchData'
import SharedCountdown from '@/components/SharedCountdown'
import UserRegistrationCounter from '@/components/UserRegistrationCounter'

const COMING_FEATURES = [
  { icon: <Cpu size={20} />, title: 'Your Personal AI Coach', desc: 'Imagine having a smart tutor that knows your course content, adapts to how you learn best, and helps you crush your assignments.', tag: 'Smart Learning' },
  { icon: <BarChart2 size={20} />, title: 'No More Freeloaders', desc: 'Crystal-clear analytics show exactly who did what in group projects. Say goodbye to carrying the team without credit.', tag: 'Fairness' },
  { icon: <Zap size={20} />, title: 'Supercharged Collaboration', desc: 'Everything you need in one fast, beautiful workspace. Plan, track, and execute group tasks seamlessly without the usual stress.', tag: 'Productivity' },
  { icon: <Heart size={20} />, title: 'Built-in Wellbeing Support', desc: 'We keep an eye on your workload to prevent burnout. Get gentle nudges when it\'s time to take a break and recharge.', tag: 'Mental Health' },
  { icon: <BookOpen size={20} />, title: 'Syncs with Your School', desc: 'Connects right into Canvas, Blackboard, or Moodle so you don\'t have to copy-paste your work everywhere.', tag: 'Integrations' },
  { icon: <Globe size={20} />, title: 'Global Student Network', desc: 'Join forces with students around the world. Share awesome resources, find study buddies, and collaborate globally.', tag: 'Community' },
]

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: 'https://games.espeezy.com', label: 'Games', external: true },
  { href: 'https://kanban.espeezy.com', label: 'Kanban', external: true },
  { href: '/fund', label: 'Support Us' },
  { href: '/docs', label: 'Docs' },
  { href: '/checkout', label: 'Pricing' },
]

export default function PreRegisterPage() {
  const { config, registeredCount, configLoaded, timeLeft, setRegisteredCount } = useLaunchData()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [referrerCode, setReferrerCode] = useState<string | null>(null)
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null)
  const [myReferralCount, setMyReferralCount] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      if (ref) setReferrerCode(ref)
    }
  }, [])

  const goal = parseInt(config.preregister_goal ?? '5000', 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!email.trim()) { setSubmitError('Please enter a valid email address.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/preregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'preregister_page', ...(referrerCode != null ? { referrer_code: referrerCode } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? 'Registration failed. Please try again.')
      } else {
        setSubmitted(true)
        setMyReferralCode(data.referral_code || null)
        setMyReferralCount(data.referral_count || 0)
        if (data.count) setRegisteredCount(data.count)
      }
    } catch (_) {
      setSubmitError('Network error. Please check your connection and try again.')
    }
    setSubmitting(false)
  }

  return (
    <MotionConfig reducedMotion="user">
    <>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>

      {/* Subtle dot-grid overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Gradient blobs */}
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '30%', left: '40%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav aria-label="Primary navigation" style={{ position: 'sticky', top: 0, zIndex: 1000, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1rem, 4vw, 2.5rem)', borderBottom: '1px solid rgba(15,23,42,0.07)', backdropFilter: 'blur(16px)', backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/brand_logo2.svg" style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="" aria-hidden="true" />
          </div>
          <span style={{ fontWeight: 950, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.03em' }}>{config.brand_name}</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hide-mobile">
          {NAV_LINKS.map(link =>
            link.external ? (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(15,23,42,0.55)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#0f172a')}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(15,23,42,0.55)')}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(15,23,42,0.55)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#0f172a')}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(15,23,42,0.55)')}>  
                {link.label}
              </Link>
            )
          )}
        </div>
        <a href="#register" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: 'var(--brand)', fontSize: '0.8rem', fontWeight: 800, color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Join Early Access
        </a>
      </nav>

      {/* Hero */}
      <main id="main-content">
      <section id="hero" style={{ padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '7px 18px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '100px', marginBottom: '2rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Early Access: Now Open</span>
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, margin: '0 auto 1.5rem', maxWidth: '960px' }}>
          The platform that gives every student a{' '}
          <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            fair voice.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.25 }}
          style={{ color: '#64748b', maxWidth: '680px', margin: '0 auto 3rem', fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', lineHeight: 1.6, fontWeight: 500 }}>
          {config.launch_message}
        </motion.p>

        {configLoaded && <SharedCountdown timeLeft={timeLeft} />}
        <UserRegistrationCounter registeredCount={registeredCount} goal={goal} />
      </section>

      {/* Registration Form */}
      <section id="register" style={{ padding: '0 clamp(1rem, 4vw, 2.5rem) clamp(4rem, 8vw, 7rem)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.09)', borderRadius: '20px', padding: 'clamp(2rem, 5vw, 3rem)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(15,23,42,0.1)' }}>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={28} color="var(--brand)" />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>You are on the list.</h2>
                  <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>
                    We will email you the moment {config.brand_name} opens its doors.
                  </p>
                  {myReferralCode && (
                    <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Users size={18} color="var(--brand)" />
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Share &amp; Get Rewards</span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Refer friends and climb the leaderboard. Top referrers get 6 months free when we launch.
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                        <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <code style={{ fontSize: '0.8rem', color: '#0f172a', wordBreak: 'break-all', flex: 1 }}>
                            https://espeezy.com/preregister?ref={myReferralCode}
                          </code>
                          <button
                            onClick={() => {
                              const url = `https://espeezy.com/preregister?ref=${myReferralCode}`
                              navigator.clipboard.writeText(url).catch(() => alert('Failed to copy'))
                            }}
                            style={{ marginLeft: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Copy Link
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: '#64748b' }}>You&apos;ve referred:</span>
                          <span style={{ color: 'var(--brand)', fontWeight: 700 }}>{myReferralCount} {myReferralCount === 1 ? 'friend' : 'friends'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.15)', color: '#64748b', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                      Back to Home
                    </Link>
                    <Link href="/fund" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: 'var(--brand)', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                      Support the Mission →
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} aria-label="Register for early access" noValidate>
                  <div style={{ marginBottom: '0.5rem', display: 'inline-flex', padding: '4px 12px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '100px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Free Forever Plan · Early Access</span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 950, letterSpacing: '-0.04em', margin: '1rem 0 0.5rem', lineHeight: 1.1 }}>
                    Secure your spot.<br />
                    <span style={{ color: 'var(--brand)' }}>No credit card required.</span>
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    Register your interest today and get priority access, exclusive early features, and founding member recognition.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <label htmlFor="prereg-email" className="sr-only">Email address (required)</label>
                    <input
                      id="prereg-email"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      aria-required="true"
                      aria-describedby={submitError ? 'prereg-error' : undefined}
                      style={{ width: '100%', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.15)', background: '#f8fafc', color: '#0f172a', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
                    {submitError && (
                      <div id="prereg-error" role="alert" aria-live="assertive" style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '0.85rem' }}>
                        {submitError}
                      </div>
                    )}
                    <button type="submit" disabled={submitting}
                      style={{ width: '100%', padding: '0.95rem', borderRadius: '10px', background: submitting ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', color: 'white', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'opacity 0.15s' }}>
                      {submitting ? 'Registering…' : <><Mail size={16} /> Join the Waitlist. It&apos;s Free.</>}
                    </button>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                      By registering you agree to our <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>. No spam. Ever.
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Product Gallery */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(15,23,42,0.07)', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1rem' }}>
              Get a first look at the product.
            </h2>
            <p style={{ color: '#64748b', maxWidth: '620px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
              Built for students, educators, and institutions who need transparency and speed.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {[
              { src: '/screenshots/dashboard.png', title: 'Smart Dashboard', desc: 'Track contribution, deadlines, and progress in one place.' },
              { src: '/screenshots/admin.png', title: 'Institutional Control', desc: 'Educator-grade visibility and actionable insights for teams.' },
              { src: '/screenshots/terminal.png', title: 'Secure Core', desc: 'Fast, dependable infrastructure designed for real workloads.' },
              { src: '/screenshots/mobile.png', title: 'Mobile Experience', desc: 'Collaborate and stay synced from anywhere.' }
            ].map((img, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(15,23,42,0.09)', background: 'white', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
                <div style={{ aspectRatio: '16 / 10', overflow: 'hidden' }}>
                  <img src={img.src} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.35rem' }}>{img.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{img.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(15,23,42,0.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, maxWidth: '820px', margin: '0 auto 1.25rem' }}>
            Group work is broken.<br /><span style={{ color: 'var(--brand)' }}>We are fixing it.</span>
          </h2>
          <p style={{ color: '#64748b', maxWidth: '640px', margin: '0 auto 4rem', fontSize: '1.05rem', lineHeight: 1.65 }}>
            Every year millions of students receive the same grade despite wildly different contributions. {config.brand_name} ends this cycle with data, transparency, and fairness at its core.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: <GraduationCap size={22} />, stat: '73%', label: 'of students feel their individual effort is not fairly recognised in group assessments.' },
              { icon: <Users size={22} />, stat: '2.4B+', label: 'students worldwide will benefit from transparent, equitable collaboration tools.' },
              { icon: <TrendingUp size={22} />, stat: '3×', label: 'more likely to complete a course when accountability and recognition systems are in place.' },
              { icon: <Globe size={22} />, stat: '195', label: 'countries where fair access to quality educational tools remains a critical gap.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: '1.75rem 1.5rem', background: 'white', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '16px', textAlign: 'left', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
                <div style={{ color: 'var(--brand)', marginBottom: '1rem', opacity: 0.7 }}>{item.icon}</div>
                <div style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 950, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>{item.stat}</div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.55, margin: 0 }}>{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Features */}
      <section id="features" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(15,23,42,0.07)', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '1rem' }}>
              Built for the next era of education.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {COMING_FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ padding: '1.5rem', background: 'white', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '14px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', color: 'var(--brand)' }}>{f.icon}</div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 8px', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '100px' }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2.5rem)', borderTop: '1px solid rgba(15,23,42,0.07)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2rem' }}>
            Designed to work alongside
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            {['Nile LMS', 'Canvas', 'Blackboard', 'Moodle', 'Google Classroom', 'Microsoft Teams for Education', 'Turnitin', 'GitHub Education'].map(name => (
              <div key={name} style={{ padding: '0.6rem 1.25rem', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(15,23,42,0.07)', background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(6,182,212,0.04) 50%, rgba(16,185,129,0.04) 100%)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: '1.5rem' }}>
            Be part of the<br /><span style={{ color: 'var(--brand)' }}>founding generation.</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            5 million pre-registrations. One mission. Free, fair, and powerful education infrastructure for every student on the planet.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#register" style={{ padding: '1rem 2.25rem', borderRadius: '12px', background: 'var(--brand)', color: 'white', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Register Now <ArrowRight size={18} />
            </a>
            <Link href="/fund" style={{ padding: '1rem 2.25rem', borderRadius: '12px', border: '1px solid rgba(15,23,42,0.15)', color: '#475569', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
              Support the Mission
            </Link>
          </div>
        </motion.div>
      </section>

      </main>
      </div>
    </>
    </MotionConfig>
  )
}
