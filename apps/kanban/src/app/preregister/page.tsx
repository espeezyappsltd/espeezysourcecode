'use client'

import { type ComponentPropsWithoutRef, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, CheckCircle, Users, Globe,
  BookOpen, Cpu, Zap, BarChart2, Mail,
  GraduationCap, TrendingUp, Heart
} from 'lucide-react'

import { useLaunchData } from '@/hooks/useLaunchData'
import SharedCountdown from '@/components/SharedCountdown'
import UserRegistrationCounter from '@/components/UserRegistrationCounter'
import { submitPreregistration } from '@/services/preregister'
import { SCREENSHOT_ASSETS } from '@shared/assets'
import { HERO_ANALYTICS_CAPTION, HERO_ANALYTICS_TAGLINE } from '@shared/platform-brand'

// ─── Coming Features ─────────────────────────────────────────────────────────
const COMING_FEATURES = [
  { icon: <Cpu size={20} />, title: 'Your Personal AI Coach', desc: 'Imagine having a smart tutor that knows your course content, adapts to how you learn best, and helps you crush your assignments.', tag: 'Smart Learning' },
  { icon: <BarChart2 size={20} />, title: 'No More Freeloaders', desc: 'Crystal-clear analytics show exactly who did what in group projects. Say goodbye to carrying the team without credit.', tag: 'Accountability' },
  { icon: <Zap size={20} />, title: 'Supercharged Collaboration', desc: 'Everything you need in one fast, beautiful workspace. Plan, track, and execute group tasks seamlessly without the usual stress.', tag: 'Productivity' },
  { icon: <Heart size={20} />, title: 'Built-in Wellbeing Support', desc: 'We keep an eye on your workload to prevent burnout. Get gentle nudges when it’s time to take a break and recharge.', tag: 'Mental Health' },
  { icon: <BookOpen size={20} />, title: 'Syncs with Your School', desc: 'Connects right into Canvas, Blackboard, or Moodle so you don’t have to copy-paste your work everywhere.', tag: 'Integrations' },
  { icon: <Globe size={20} />, title: 'Global Student Network', desc: 'Join forces with students around the world. Share awesome resources, find study buddies, and collaborate globally.', tag: 'Community' },
]

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '/', label: 'Early Access' },
  { href: '/#features', label: 'Features' },
  { href: '/#register', label: 'Register' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PreRegisterPage() {
  const { config, registeredCount, configLoaded, timeLeft, setRegisteredCount } = useLaunchData()

  // Form state
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [referrerCode, setReferrerCode] = useState<string | null>(null)
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null)
  const [myReferralCount, setMyReferralCount] = useState(0)
  const [confirmMessage, setConfirmMessage] = useState('')

  // Extract ?ref= parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      setReferrerCode(ref)
    }
  }, [])

  const goal = parseInt(config.preregister_goal ?? '5000000', 10)

  const handleSubmit: NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']> = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!email.trim()) {
      setSubmitError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const { ok, data } = await submitPreregistration({
        email,
        source: 'preregister_page',
        ...(referrerCode != null ? { referrer_code: referrerCode } : {}),
      })
      if (!ok) {
        setSubmitError(data.error ?? 'Registration failed. Please try again.')
      } else {
        setSubmitted(true)
        setMyReferralCode(data.referral_code || null)
        setMyReferralCount(data.referral_count || 0)
        setConfirmMessage(data.message || '')
        if (typeof data.count === 'number') setRegisteredCount(data.count)
      }
    } catch (_) {
      setSubmitError('Network error. Please check your connection and try again.')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', overflowX: 'hidden', fontFamily: 'inherit' }}>
      <a href="#register" style={{ position: 'absolute', left: 8, top: 8, zIndex: 2000, background: '#111', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: 8, transform: 'translateY(-200%)' }} onFocus={(e) => (e.currentTarget.style.transform = 'translateY(0)')} onBlur={(e) => (e.currentTarget.style.transform = 'translateY(-200%)')}>
        Skip to registration form
      </a>

      {/* ── Grid overlay ─────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(16,185,129,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav aria-label="Primary" style={{ position: 'sticky', top: 0, zIndex: 1000, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1rem, 4vw, 2.5rem)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', backgroundColor: 'rgba(10,10,10,0.85)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image src="/brand_logo2.svg" width={22} height={22} style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="Espeezy" priority />
          </div>
          <span style={{ fontWeight: 950, fontSize: '1rem', color: 'white', letterSpacing: '-0.03em' }}>{config.brand_name}</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hide-mobile">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'white')}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="#register" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: 'var(--brand)', fontSize: '0.8rem', fontWeight: 800, color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Join Early Access
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <main id="main-content">
      <section id="hero" aria-label="Pre-register overview" style={{ padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '7px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', marginBottom: '2rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Early Access  -  Now Open</span>
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.08, margin: '0 auto 1.25rem', maxWidth: '920px' }}>
          The Espeezy Analytics Dashboard shows{' '}
          <span style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #34d399 50%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            who did the work—and who didn&apos;t.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
          style={{ color: 'rgba(255,255,255,0.72)', maxWidth: '720px', margin: '0 auto 1.25rem', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', lineHeight: 1.65, fontWeight: 500 }}>
          {HERO_ANALYTICS_TAGLINE}
        </motion.p>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.28 }}
          style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '680px', margin: '0 auto 2rem', fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)', lineHeight: 1.6, fontWeight: 500 }}>
          {config.launch_message}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '960px',
            margin: '0 auto 2.5rem',
            aspectRatio: '16 / 9',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(16,185,129,0.25)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.45)',
          }}
        >
          <Image
            src={SCREENSHOT_ASSETS.ANALYTICS_DASHBOARD}
            alt="Espeezy Analytics Dashboard showing contribution scores and project intelligence"
            fill
            sizes="(max-width: 960px) 100vw, 960px"
            quality={55}
            priority
            style={{ objectFit: 'cover', objectPosition: 'top center' }}
          />
          <div
            style={{
              position: 'absolute',
              left: '1rem',
              bottom: '1rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.75)',
              border: '1px solid rgba(16,185,129,0.35)',
            }}
          >
            <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6ee7b7' }}>
              {HERO_ANALYTICS_CAPTION}
            </span>
          </div>
        </motion.div>
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 12, padding: '1.25rem 1.5rem', margin: '0 auto 2.5rem', maxWidth: 540, color: '#6ee7b7', fontWeight: 600, fontSize: '1.05rem' }}>
          <span style={{ color: '#10b981', fontWeight: 800 }}>New: Role-Based Access Control (RBAC)</span><br />
          <ul style={{ margin: '0.5em 0 0 1.2em', padding: 0, color: '#6ee7b7', fontSize: '0.98em' }}>
            <li>Log in with a personal email for <strong>Free Tier</strong> access.</li>
            <li>Upgrade to <strong>Premium</strong> by verifying your school or institutional email.</li>
            <li>Roles: <strong>Personal</strong> (free), <strong>Student</strong> (premium), <strong>Educator</strong>, <strong>Admin</strong>.</li>
            <li>Premium features unlock automatically when your email is verified as belonging to a recognized institution.</li>
          </ul>
          <span style={{ color: '#10b981', fontWeight: 700 }}>You control your workspace, your data, and your team.</span>
        </div>

        {/* Countdown */}
        {configLoaded && <SharedCountdown timeLeft={timeLeft} />}

        {/* User Counter */}
        <UserRegistrationCounter registeredCount={registeredCount} goal={goal} />
      </section>

      {/* ── REGISTRATION FORM ─────────────────────────────────────────────── */}
      <section id="register" aria-label="Registration form" style={{ padding: '0 clamp(1rem, 4vw, 2.5rem) clamp(4rem, 8vw, 7rem)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: 'clamp(2rem, 5vw, 3rem)', backdropFilter: 'blur(20px)', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={28} color="var(--brand)" />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>
                    You are in the list 🙂
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    We will be in touch the moment {config.brand_name} launches.
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    What would you like to do next?
                  </p>

                  {/* Referral Section */}
                  {myReferralCode && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Users size={18} color="var(--brand)" />
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Share & Get Rewards</span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Refer friends and climb the leaderboard. Top referrers get 6 months free when we launch.
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <code style={{ fontSize: '0.8rem', color: 'white', wordBreak: 'break-all', flex: 1 }}>
                            https://espeezy.com/preregister?ref={myReferralCode}
                          </code>
                          <button
                            onClick={() => {
                              const url = `https://espeezy.com/preregister?ref=${myReferralCode}`
                              navigator.clipboard.writeText(url).catch(() => alert('Failed to copy'))
                            }}
                            style={{ marginLeft: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Copy Link
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>You&apos;ve referred:</span>
                          <span style={{ color: 'var(--brand)', fontWeight: 700 }}>{myReferralCount} {myReferralCount === 1 ? 'friend' : 'friends'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/" style={{ padding: '0.875rem 1.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      ← Back to Home
                    </Link>
                    <a href="#features" style={{ padding: '0.875rem 1.75rem', borderRadius: '10px', background: 'var(--brand)', color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      Explore What&apos;s Coming →
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} noValidate>
                  <div style={{ marginBottom: '0.5rem', display: 'inline-flex', padding: '4px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '100px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Free Forever Plan · Early Access</span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 950, letterSpacing: '-0.04em', margin: '1rem 0 0.5rem', lineHeight: 1.1 }}>
                    Secure your spot.<br />
                    <span style={{ color: 'var(--brand)' }}>No credit card required.</span>
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    Register for priority access and early features—backed by our 12-person platform team running Espeezy&apos;s backend.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <label htmlFor="preregister-email" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                      Email address
                    </label>
                    <input id="preregister-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required aria-required="true" aria-invalid={Boolean(submitError)} aria-describedby={submitError ? 'preregister-error' : undefined}
                      style={{ width: '100%', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />

                    {submitError && (
                      <div id="preregister-error" role="alert" aria-live="polite" style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.85rem' }}>
                        {submitError}
                      </div>
                    )}

                    <button type="submit" disabled={submitting} aria-busy={submitting}
                      style={{ width: '100%', padding: '0.95rem', borderRadius: '10px', background: submitting ? 'rgba(16,185,129,0.5)' : 'var(--brand)', color: 'white', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', letterSpacing: '-0.01em', transition: 'opacity 0.15s' }}>
                      {submitting ? 'Registering…' : <><Mail size={16} /> Join the Waitlist  -  It&apos;s Free</>}
                    </button>

                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                      By registering you agree to our Privacy Policy. No spam  -  ever. Unsubscribe any time.
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── PRODUCT GALLERY ──────────────────────────────────────────────── */}
      <section aria-label="Product gallery" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', padding: '5px 14px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '100px', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Experience the Future</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1rem' }}>
              A powerful interface for<br />high-performance students.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {[
              { src: '/screenshots/dashboard.png', title: 'Smart Dashboard', desc: 'Real-time velocity tracking and team heatmaps.' },
              { src: '/screenshots/admin.png', title: 'Institutional Control', desc: 'Powerful tools for educators to monitor engagement.' },
              { src: '/screenshots/terminal.png', title: 'The Gateway', desc: 'Institutional-grade data orchestration and security.' },
              { src: '/screenshots/mobile.png', title: 'Go Mobile', desc: 'Sync your tasks and collaborate from anywhere.' }
            ].map((img, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ position: 'relative', aspectRatio: '16 / 10' }}>
                  <Image src={img.src} alt={img.title} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} />
                </div>
                <div style={{ padding: '1.5rem', background: 'linear-gradient(to top, #0a0a0a 0%, transparent 100%)', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{img.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{img.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY THIS MATTERS ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '5px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '100px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>The Problem We Solve</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.25rem', maxWidth: '820px', margin: '0 auto 1.25rem' }}>
            Group work is broken.<br />
            <span style={{ color: 'var(--brand)' }}>We are fixing it.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '640px', margin: '0 auto 4rem', fontSize: '1.05rem', lineHeight: 1.65 }}>
            Every year millions of students receive the same grade despite wildly different contributions. Educators lack visibility. High performers burn out. Free riders pass. {config.brand_name} ends this cycle  -  with data, transparency, and accountability at its core.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: <GraduationCap size={22} />, stat: '73%', label: 'of students feel their individual effort is not accurately recognised in group assessments.' },
              { icon: <Users size={22} />, stat: '2.4B+', label: 'students worldwide will benefit from transparent, equitable collaboration tools.' },
              { icon: <TrendingUp size={22} />, stat: '3x', label: 'more likely to complete a course when accountability and recognition systems are in place.' },
              { icon: <Globe size={22} />, stat: '195', label: 'countries where equitable access to quality educational tools remains a critical gap.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: '1.75rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', textAlign: 'left' }}>
                <div style={{ color: 'var(--brand)', marginBottom: '1rem', opacity: 0.7 }}>{item.icon}</div>
                <div style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 950, letterSpacing: '-0.05em', marginBottom: '0.5rem', color: 'white' }}>{item.stat}</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.55, margin: 0 }}>{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMING FEATURES ──────────────────────────────────────────────── */}
      <section id="features" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '5px 14px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '100px', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>What&apos;s Coming in V2</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1rem' }}>
              Built for the next era of education.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
              These features are in active development. Your pre-registration and support directly accelerates their delivery.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {COMING_FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', transition: 'border-color 0.2s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)')}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', color: 'var(--brand)' }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 8px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '100px' }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2.5rem)', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2rem' }}>
            Designed to work alongside
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            {['Nile LMS', 'Canvas', 'Blackboard', 'Moodle', 'Google Classroom', 'Microsoft Teams for Education', 'Turnitin', 'GitHub Education'].map(name => (
              <div key={name} style={{ padding: '0.6rem 1.25rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: '1.5rem' }}>
            Be part of the<br />
            <span style={{ color: 'var(--brand)' }}>campus launch cohort.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            5 million pre-registrations. One mission. Free, equitable, and powerful education infrastructure  -  for every student on the planet.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#register" style={{ padding: '1rem 2.25rem', borderRadius: '12px', background: 'var(--brand)', color: 'white', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Register Now <ArrowRight size={18} />
            </a>
            <a href="#features" style={{ padding: '1rem 2.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
              See the Product Vision
            </a>
          </div>
        </motion.div>
      </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', maxWidth: '600px' }}>
            <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.75rem' }}>About the Project</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Hey there! We&apos;re building Espeezy to make student collaboration more equitable and completely stress-free. It&apos;s an open, fast, and secure platform powered by modern technologies like Next.js and Firebase. By signing up now with your email, you help us understand how many students need this, which speeds up our development. We promise no spam - just early access!
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={13} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.02em' }}>{config.brand_name}</span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[['/', 'Early Access'], ['/#features', 'Features'], ['/#register', 'Register']].map(([href, label]) => (
                <Link key={href} href={href} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                  {label}
                </Link>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', margin: 0 }} suppressHydrationWarning>
              © {new Date().getFullYear()} {config.brand_name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 640px) { .hide-mobile { display: none !important; } }
      `}</style>
    </div>
  )
}
