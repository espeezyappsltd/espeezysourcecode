'use client'

import { type ComponentPropsWithoutRef, Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Users,
  Mail,
  LayoutDashboard,
  Target,
  Route,
} from 'lucide-react'

import { useLaunchData } from '@/hooks/useLaunchData'
import SharedCountdown from '@/components/SharedCountdown'
import UserRegistrationCounter from '@/components/UserRegistrationCounter'
import { submitPreregistration } from '@/services/preregister'
import { SCREENSHOT_ASSETS } from '@shared/assets'
import { ESPEEZY_APP_ORIGINS } from '@shared/app-url'
import {
  HERO_ANALYTICS_CAPTION,
  HERO_COPY_LINES,
  KANBAN_DEMO_LABEL,
  KANBAN_DEMO_PATH,
  PLATFORM_OPERATIONS_TAGLINE,
  PLATFORM_TEAM_SIZE,
  FOOTER_TECH_BLURB,
  formatCopyrightNotice,
} from '@shared/platform-brand'
import {
  PREREG_NAV,
  USER_JOURNEY,
  VERIFIABLE_OUTCOMES,
  LIVE_MODULES,
  ROADMAP_ITEMS,
  buildPlatformTeamSlots,
} from './preregister-content'
import EspeezyAppLogo from '@shared/EspeezyAppLogo'
import './preregister.css'

const PLATFORM_TEAM = buildPlatformTeamSlots()

function PreRegisterPageContent() {
  const searchParams = useSearchParams()
  const referrerCode = searchParams?.get('ref') ?? null
  const { config, registeredCount, configLoaded, timeLeft, setRegisteredCount } = useLaunchData()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null)
  const [myReferralCount, setMyReferralCount] = useState(0)
  const [confirmMessage, setConfirmMessage] = useState('')

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
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="prereg-page">
      <a
        href="#register"
        style={{
          position: 'absolute',
          left: 8,
          top: 8,
          zIndex: 2000,
          background: '#111',
          color: '#fff',
          padding: '0.5rem 0.75rem',
          borderRadius: 8,
          transform: 'translateY(-200%)',
        }}
        onFocus={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        onBlur={(e) => (e.currentTarget.style.transform = 'translateY(-200%)')}
      >
        Skip to registration form
      </a>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(16,185,129,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          right: '-10%',
          width: '70vw',
          height: '70vw',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <nav
        aria-label="Primary"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1rem, 4vw, 2.5rem)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(10,10,10,0.85)',
        }}
      >
        <Link href="/preregister" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <EspeezyAppLogo app="kanban" variant="nav" />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hide-mobile">
          {PREREG_NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.55)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#register"
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            background: 'var(--brand)',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'white',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Join Early Access
        </a>
      </nav>

      <main id="main-content">
        {/* Hero */}
        <section id="hero" className="prereg-section" aria-label="Overview" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '7px 18px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '100px',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  boxShadow: '0 0 8px var(--brand)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                Kanban app live · Early access open
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{ maxWidth: '820px', margin: '0 auto 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
          >
            <h1 style={{ margin: 0, fontSize: 'clamp(1.35rem, 3.8vw, 2.35rem)', fontWeight: 950, letterSpacing: '-0.03em', lineHeight: 1.15, color: '#f8fafc' }}>
              {HERO_COPY_LINES[0]}
            </h1>
            <p style={{ margin: 0, fontSize: 'clamp(1rem, 2.2vw, 1.1rem)', fontWeight: 500, lineHeight: 1.55, color: 'rgba(255,255,255,0.78)' }}>
              {HERO_COPY_LINES[1]}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
              {PLATFORM_OPERATIONS_TAGLINE}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', margin: '0 auto 2rem' }}
          >
            <Link
              href={KANBAN_DEMO_PATH}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.5rem',
                borderRadius: '12px',
                border: '2px solid var(--brand)',
                background: 'rgba(16,185,129,0.12)',
                color: '#6ee7b7',
                fontSize: '0.9rem',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <LayoutDashboard size={18} aria-hidden />
              {KANBAN_DEMO_LABEL}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <a
              href="#journey"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.9rem',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <Route size={18} aria-hidden />
              See the full journey
            </a>
            <a
              href="#register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.5rem',
                borderRadius: '12px',
                background: 'var(--brand)',
                color: '#0a0a0a',
                fontSize: '0.9rem',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Join Early Access
              <ArrowRight size={16} aria-hidden />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '960px',
              margin: '0 auto 2rem',
              aspectRatio: '16 / 9',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(16,185,129,0.25)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.45)',
            }}
          >
            <Image
              src={SCREENSHOT_ASSETS.ANALYTICS_DASHBOARD}
              alt="Espeezy Kanban dashboard with boards, analytics, and team collaboration"
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

          {configLoaded && <SharedCountdown timeLeft={timeLeft} />}
          <UserRegistrationCounter registeredCount={registeredCount} goal={goal} />
        </section>

        {/* Registration — early in flow for conversion, repeated at bottom via nav */}
        <section id="register" className="prereg-section prereg-section--border" aria-label="Registration form">
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: 'clamp(2rem, 5vw, 3rem)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                      <CheckCircle size={28} color="var(--brand)" />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>You are on the list</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                      {confirmMessage.trim() ? confirmMessage : `We will email you when ${config.brand_name} opens the next cohort.`}
                    </p>
                    {myReferralCode && (
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <Users size={18} color="var(--brand)" />
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Share your link</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          Refer friends before launch. Top referrers get 6 months free when we open the cohort.
                        </p>
                        <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                          <code style={{ fontSize: '0.75rem', color: 'white', wordBreak: 'break-all', flex: 1 }}>
                            https://kanban.espeezy.com/preregister?ref={myReferralCode}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`https://kanban.espeezy.com/preregister?ref=${myReferralCode}`).catch(() => alert('Failed to copy'))
                            }}
                            style={{ padding: '0.5rem 0.75rem', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Copy
                          </button>
                        </div>
                        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          Referred: <strong style={{ color: 'var(--brand)' }}>{myReferralCount}</strong>
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Link href={KANBAN_DEMO_PATH} style={{ padding: '0.875rem 1.75rem', borderRadius: '10px', background: 'var(--brand)', color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>
                        Try the live demo
                      </Link>
                      <a href="#journey" style={{ padding: '0.875rem 1.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>
                        Read the journey →
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} noValidate>
                    <span className="prereg-eyebrow" style={{ marginBottom: '1rem' }}>Free student tier · Early access</span>
                    <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 950, letterSpacing: '-0.04em', margin: '0 0 0.5rem', lineHeight: 1.1 }}>
                      Reserve your place in the cohort
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                      Pre-register to get launch access to the same Kanban app described below — run by our {PLATFORM_TEAM_SIZE}-person platform team.
                    </p>
                    <label htmlFor="preregister-email" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '0.5rem' }}>
                      Email address
                    </label>
                    <input
                      id="preregister-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(submitError)}
                      aria-describedby={submitError ? 'preregister-error' : undefined}
                      style={{ width: '100%', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.875rem' }}
                    />
                    {submitError && (
                      <div id="preregister-error" role="alert" style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '0.875rem' }}>
                        {submitError}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      aria-busy={submitting}
                      style={{ width: '100%', padding: '0.95rem', borderRadius: '10px', background: submitting ? 'rgba(16,185,129,0.5)' : 'var(--brand)', color: 'white', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {submitting ? 'Registering…' : (
                        <>
                          <Mail size={16} aria-hidden /> Join the waitlist — free
                        </>
                      )}
                    </button>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.5, margin: '0.75rem 0 0' }}>
                      No credit card. Unsubscribe anytime.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* User journey */}
        <section id="journey" className="prereg-section prereg-section--border" aria-labelledby="journey-heading">
          <div className="prereg-container">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span className="prereg-eyebrow">End-to-end path</span>
              <h2 id="journey-heading" className="prereg-h2">
                Your journey on <span style={{ color: 'var(--brand)' }}>Espeezy</span>
              </h2>
              <p className="prereg-lead prereg-lead--center" style={{ marginBottom: 0 }}>
                Nine steps mirror what is live in the Kanban app today — from registration through team coordination, contribution records, and peer resource exchange.
              </p>
            </div>
            <ol className="journey-list">
              {USER_JOURNEY.map((step) => (
                <motion.li
                  key={step.step}
                  className="journey-step"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: step.step * 0.04 }}
                >
                  <div className="journey-step__num" aria-hidden>
                    {step.step}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="journey-step__icon">{step.icon}</span>
                      <h3 className="journey-step__title">{step.title}</h3>
                    </div>
                    <p className="journey-step__summary">{step.summary}</p>
                    <p className="journey-step__surface">In the app: {step.appSurface}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Verifiable outcomes */}
        <section id="outcomes" className="prereg-section prereg-section--border" aria-labelledby="outcomes-heading">
          <div className="prereg-container">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span className="prereg-eyebrow">
                <Target size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} aria-hidden />
                What you get
              </span>
              <h2 id="outcomes-heading" className="prereg-h2">
                Verifiable outcomes when you use it as intended
              </h2>
              <p className="prereg-lead prereg-lead--center" style={{ marginBottom: 0 }}>
                Not vague promises — each outcome maps to data the platform already records: boards, logs, ledgers, and team governance.
              </p>
            </div>
            <div className="outcomes-grid">
              {VERIFIABLE_OUTCOMES.map((o, i) => (
                <motion.article
                  key={o.title}
                  className="outcome-card"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  {o.metric && <span className="outcome-card__metric">{o.metric}</span>}
                  <h3>{o.title}</h3>
                  <p className="outcome-card__block">
                    <strong>You get:</strong> {o.youGet}
                  </p>
                  <p className="outcome-card__verified">
                    <strong>Verified by:</strong> {o.verifiedBy}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Live vs roadmap */}
        <section id="live" className="prereg-section prereg-section--border" aria-labelledby="live-heading">
          <div className="prereg-container">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="prereg-eyebrow">Shipped in Kanban</span>
              <h2 id="live-heading" className="prereg-h2">
                What&apos;s live right now
              </h2>
              <p className="prereg-lead prereg-lead--center" style={{ marginBottom: 0 }}>
                Sidebar routes you can use after registration. Pre-register to receive product updates as new capabilities are released.
              </p>
            </div>
            <div className="live-grid">
              {LIVE_MODULES.map((mod) => (
                <div key={mod.name} className="live-chip">
                  <div className="live-chip__name">{mod.name}</div>
                  <p className="live-chip__desc">{mod.desc}</p>
                </div>
              ))}
            </div>
            <div className="roadmap-list" aria-labelledby="roadmap-heading">
              <h3 id="roadmap-heading" style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
                On the roadmap (not required to start)
              </h3>
              {ROADMAP_ITEMS.map((item) => (
                <div key={item.title} className="roadmap-item">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform team of 12 */}
        <section id="team" className="prereg-section prereg-section--border" aria-labelledby="team-heading">
          <div className="prereg-container" style={{ textAlign: 'center' }}>
            <span className="prereg-eyebrow">Behind the product</span>
            <h2 id="team-heading" className="prereg-h2">
              The {PLATFORM_TEAM_SIZE}-person platform team
            </h2>
            <p className="prereg-lead prereg-lead--center">
              Espeezy is operated by a dedicated team responsible for production infrastructure, billing, deployments, and customer support.
            </p>
            <div className="team-grid" style={{ textAlign: 'center' }}>
              {PLATFORM_TEAM.map((member) => (
                <div key={member.slot} className="team-slot">
                  <div className="team-slot__avatar" aria-hidden>
                    {String(member.slot).padStart(2, '0')}
                  </div>
                  <p className="team-slot__role">{member.role}</p>
                  <p className="team-slot__bio">Bio coming soon</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="prereg-section prereg-section--border" style={{ textAlign: 'center' }}>
          <div className="prereg-container" style={{ maxWidth: '720px' }}>
            <h2 className="prereg-h2">
              Join the cohort.<br />
              <span style={{ color: 'var(--brand)' }}>Use Espeezy as it was built.</span>
            </h2>
            <p className="prereg-lead prereg-lead--center">
              Structured group collaboration, traceable contribution records, and tools designed for academic teams.
            </p>
            <a
              href="#register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 2.25rem',
                borderRadius: '12px',
                background: 'var(--brand)',
                color: 'white',
                fontWeight: 800,
                fontSize: '1rem',
                textDecoration: 'none',
              }}
            >
              Register now <ArrowRight size={18} aria-hidden />
            </a>
          </div>
        </section>
      </main>

      <footer className="prereg-section prereg-section--border" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="prereg-container">
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', lineHeight: 1.65, maxWidth: '640px', marginBottom: '1.5rem' }}>
            {FOOTER_TECH_BLURB} Pre-registration helps us plan capacity for new deployments. You will receive launch updates only.
          </p>

          <aside
            className="prereg-live-apps"
            aria-label="Live Espeezy apps"
            style={{
              marginBottom: '2rem',
              padding: '1rem 1.15rem',
              borderRadius: '12px',
              border: '1px solid rgba(16,185,129,0.22)',
              background: 'rgba(16,185,129,0.06)',
              maxWidth: '520px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.55)' }}>
              <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>Applications are live.</strong> You can sign in and use the platform today. Pre-registration provides early-access updates and benefits; it is not required for access.
            </p>
            <p style={{ margin: '0.65rem 0 0', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center' }}>
              <a
                href={ESPEEZY_APP_ORIGINS.kanban}
                style={{ color: 'var(--brand)', fontWeight: 800, textDecoration: 'none' }}
                rel="noopener noreferrer"
              >
                Kanban → {ESPEEZY_APP_ORIGINS.kanban.replace(/^https:\/\//, '')}
              </a>
              <span style={{ color: 'rgba(255,255,255,0.2)' }} aria-hidden>
                ·
              </span>
              <a
                href={ESPEEZY_APP_ORIGINS.games}
                style={{ color: 'var(--brand)', fontWeight: 800, textDecoration: 'none' }}
                rel="noopener noreferrer"
              >
                Games → {ESPEEZY_APP_ORIGINS.games.replace(/^https:\/\//, '')}
              </a>
            </p>
          </aside>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={16} color="var(--brand)" aria-hidden />
              <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>{config.brand_name}</span>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {PREREG_NAV.map((link) => (
                <a key={link.href} href={link.href} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 600 }}>
                  {link.label}
                </a>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.55, maxWidth: '520px' }} suppressHydrationWarning>
              {formatCopyrightNotice()}
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

export default function PreRegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#94a3b8' }}>
          Loading…
        </div>
      }
    >
      <PreRegisterPageContent />
    </Suspense>
  )
}
