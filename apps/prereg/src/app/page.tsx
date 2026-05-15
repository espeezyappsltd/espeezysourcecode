'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import type { Session, User } from '@supabase/supabase-js'
import {
  ArrowRight, CheckCircle, Users, Globe,
  BookOpen, Cpu, Zap, BarChart2, Mail,
  GraduationCap, TrendingUp, Heart
} from 'lucide-react'
import { useLaunchData } from '@/hooks/useLaunchData'
import SharedCountdown from '@/components/SharedCountdown'
import LiveChatWidget from '@/components/LiveChatWidget'
import ScreenshotGallery from '@/components/ScreenshotGallery'
import { SCREENSHOT_ASSETS } from '@shared/assets'

function HeroVisual({ registeredCount }: { registeredCount: number }) {
  return (
    <div style={{ position: 'relative', marginTop: '4rem', width: '100%', maxWidth: '1000px', margin: '4rem auto 0' }}>
      {/* Join Badge */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, type: 'spring' }}
        style={{ 
          position: 'absolute', top: '-2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
          background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16,185,129,0.3)',
          padding: '10px 24px', borderRadius: '100px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #0f172a', marginLeft: i > 1 ? '-8px' : 0, background: i === 1 ? '#6366f1' : i === 2 ? '#10b981' : '#f59e0b' }} />
          ))}
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>
          Join <span style={{ color: 'var(--brand)' }}>{registeredCount.toLocaleString()}</span> members already onboard
        </span>
      </motion.div>

      {/* Screenshot Layout */}
      <div style={{ position: 'relative', height: 'clamp(300px, 50vw, 500px)', width: '100%', perspective: '1000px' }}>
        
        {/* Landscape Main (Dashboard) */}
        <motion.div
          initial={{ opacity: 0, rotateX: 10, y: 40 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ 
            position: 'absolute', inset: 0, zIndex: 5, borderRadius: '24px', overflow: 'hidden', 
            border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 30px 60px rgba(15,23,42,0.15)',
            background: '#fff'
          }}
        >
          <Image 
            src={SCREENSHOT_ASSETS.PROJECT_OVERVIEW} 
            alt="Espeezy Dashboard" 
            fill
            sizes="(max-width: 1024px) 100vw, 800px"
            quality={50}
            priority
            style={{ objectFit: 'cover' }} 
          />
        </motion.div>

        {/* Portrait Left (Mobile View 1) */}
        <motion.div
          initial={{ opacity: 0, x: -60, rotateY: 15 }}
          animate={{ opacity: 1, x: -100, rotateY: 20 }}
          whileInView={{ x: [-100, -110, -100], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
          style={{ 
            position: 'absolute', top: '15%', left: '10%', width: '180px', height: '360px', zIndex: 10,
            borderRadius: '32px', overflow: 'hidden', border: '8px solid #0f172a',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'none'
          }}
          className="show-desktop"
        >
          <Image 
            src={SCREENSHOT_ASSETS.RESOURCE_CENTER} 
            alt="Mobile Dashboard" 
            fill
            sizes="180px"
            quality={40}
            style={{ objectFit: 'cover' }} 
          />
        </motion.div>

        {/* Portrait Right (Mobile View 2) */}
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -15 }}
          animate={{ opacity: 1, x: 100, rotateY: -20 }}
          whileInView={{ x: [100, 110, 100], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }}
          style={{ 
            position: 'absolute', top: '10%', right: '10%', width: '180px', height: '360px', zIndex: 10,
            borderRadius: '32px', overflow: 'hidden', border: '8px solid #0f172a',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'none'
          }}
          className="show-desktop"
        >
          <Image 
            src={SCREENSHOT_ASSETS.ASSET_MARKETPLACE} 
            alt="Mobile Marketplace" 
            fill
            sizes="180px"
            quality={40}
            style={{ objectFit: 'cover' }} 
          />
        </motion.div>

      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .show-desktop { display: block !important; }
        }
      `}</style>
    </div>
  )
}
import { supabase } from '@/lib/supabase-client'
import { submitPreregistration } from '@/services/preregister'

const COMING_FEATURES = [
  { icon: <Zap size={20} />, title: 'Unified Project Hub', desc: 'A high-performance workspace that integrates Kanban boards, shared documents, and group chat, so you never have to switch between apps to manage your academic work.', tag: 'Productivity' },
  { icon: <BarChart2 size={20} />, title: 'Contribution Proof', desc: 'Real-time tracking logs every task update and document edit, generating verifiable accountability reports to ensure every student\'s work is recognized and accurately credited.', tag: 'Visibility' },
  { icon: <BookOpen size={20} />, title: 'Deep LMS Sync', desc: 'Bi-directional connectors for Canvas, Blackboard, and Moodle automatically sync your assignments, deadlines, and grades into your centralized Espeezy dashboard.', tag: 'Integrations' },
  { icon: <GraduationCap size={20} />, title: 'Smart Study Groups', desc: 'Our AI-driven matching algorithm connects you with peers who complement your strengths, forming optimal study groups that boost collective performance.', tag: 'Collaboration' },
  { icon: <TrendingUp size={20} />, title: 'Performance Analytics', desc: 'Advanced analytics identify your work patterns and provide actionable insights to help you optimize your contributions and maximize your grades.', tag: 'Insights' },
  { icon: <Cpu size={20} />, title: 'AI-Powered Insights', desc: 'Intelligent analytics that identify your strengths in group projects, offering personalized recommendations to help you improve and excel in your coursework.', tag: 'Intelligence' },
  { icon: <Globe size={20} />, title: 'Global Peer Network', desc: 'A verified, student-only platform connecting you with peers worldwide, facilitating secure resource sharing and cross-institutional study groups.', tag: 'Community' },
  { icon: <Users size={20} />, title: 'Digital Asset Marketplace', desc: 'A secure platform where you can trade digital assets for Espeezy Credits, which can be used for exclusive features or exchanged for Pro membership.', tag: 'Opportunities' },
]

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/fund', label: 'Mission' },
  { href: '/docs', label: 'Docs' },
  { href: '/pricing', label: 'Pricing' },
]

export default function PreRegisterPage() {
  const { config, registeredCount, authUserCount, configLoaded, timeLeft, setRegisteredCount } = useLaunchData()
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'premium' | 'unknown'>('unknown')

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [referrerCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('ref')
  })
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null)
  const [myReferralCount, setMyReferralCount] = useState(0)

  const kanbanBaseUrl = process.env.NEXT_PUBLIC_KANBAN_APP_URL ?? 'https://kanban.espeezy.com'
  const gamesBaseUrl = process.env.NEXT_PUBLIC_GAMES_APP_URL ?? 'https://games.espeezy.com'

  const buildSsoUrl = (appBaseUrl: string, nextPath: string) => {
    if (!session?.access_token || !session.refresh_token) {
      return `${appBaseUrl}/login?next=${encodeURIComponent(nextPath)}`
    }

    const hash = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    return `${appBaseUrl}/sso?next=${encodeURIComponent(nextPath)}#${hash.toString()}`
  }

  const kanbanSsoUrl = buildSsoUrl(kanbanBaseUrl, '/dashboard')
  const gamesSsoUrl = buildSsoUrl(gamesBaseUrl, '/')

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(session)
      setAuthUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', session.user.id)
          .maybeSingle()
        const tier = (profile as { tier?: string } | null)?.tier
        if (tier === 'pro' || tier === 'premium' || tier === 'free') {
          setUserTier(tier)
        } else {
          setUserTier('free')
        }
      } else {
        setUserTier('unknown')
      }
    }

    void loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      setSession(session)
      setAuthUser(session?.user ?? null)

      if (!session?.user) {
        setUserTier('unknown')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', session.user.id)
        .maybeSingle()
      const tier = (profile as { tier?: string } | null)?.tier
      if (tier === 'pro' || tier === 'premium' || tier === 'free') {
        setUserTier(tier)
      } else {
        setUserTier('free')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const goal = parseInt(config.preregister_goal ?? '5000', 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!email.trim()) { setSubmitError('Please enter a valid email address.'); return }
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
        if (typeof data.count === 'number') {
          setRegisteredCount(data.count)
        } else {
          // Fallback UI bump so the counter updates immediately after a successful registration.
          setRegisteredCount(prev => prev + 1)
        }
      }
    } catch {
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
            <Image src="/brand_logo2.svg" width={22} height={22} style={{ objectFit: 'contain' }} alt="" aria-hidden="true" priority />
          </div>
          <span style={{ fontWeight: 950, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.03em' }}>{config.brand_name}</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hide-mobile">
          {NAV_LINKS.map(link =>
            <Link key={link.href} href={link.href} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(15,23,42,0.55)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(15,23,42,0.55)')}>  
              {link.label}
            </Link>
          )}
          {authUser ? (
            <>
              <a href={kanbanSsoUrl} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(15,23,42,0.7)', textDecoration: 'none' }}>Kanban</a>
              <a href={gamesSsoUrl} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(15,23,42,0.7)', textDecoration: 'none' }}>Games</a>
              <button type="button" onClick={() => void handleSignOut()} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontSize: '0.8rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>Sign out</button>
            </>
          ) : (
            <Link href="/login" style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(15,23,42,0.7)', textDecoration: 'none' }}>Account</Link>
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

        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, maxWidth: '820px', margin: '0 auto 1.25rem' }}>
          Make every team contribution<br /><span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>impossible to miss.</span>
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.25 }}
          style={{ color: '#64748b', maxWidth: '640px', margin: '0 auto 4rem', fontSize: '1.05rem', lineHeight: 1.65 }}>
          {config.brand_name} tracks exactly who does what in group projects, providing the transparent data needed for accurate grading.
        </motion.p>

        {configLoaded && <SharedCountdown timeLeft={timeLeft} />}

        {/* Hero Visual Section */}
        <HeroVisual registeredCount={registeredCount} />

        {authUser && (
          <div style={{ margin: '2rem auto 0', maxWidth: '680px', background: 'white', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '14px', padding: '1rem', textAlign: 'left', boxShadow: '0 8px 30px rgba(15,23,42,0.08)' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.92rem' }}>
              Signed in as {authUser.email}
            </p>
            <p style={{ margin: '0.35rem 0 0.8rem', color: '#64748b', fontSize: '0.82rem' }}>
              Plan: {userTier === 'unknown' ? 'Loading...' : userTier.toUpperCase()}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <a href={kanbanSsoUrl} style={{ padding: '0.55rem 0.9rem', borderRadius: '10px', background: '#10b981', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}>
                Open Kanban
              </a>
              <a href={gamesSsoUrl} style={{ padding: '0.55rem 0.9rem', borderRadius: '10px', background: '#6366f1', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}>
                Open Games
              </a>
              {userTier === 'free' && (
                <a href="https://espeezy.com/checkout" style={{ padding: '0.55rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.25)', color: '#4338ca', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem', background: 'rgba(99,102,241,0.08)' }}>
                  You need Pro for Games - Upgrade
                </a>
              )}
            </div>
          </div>
        )}
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
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>You are in the list 🙂</h2>
                  <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>
                    We will be in touch the moment {config.brand_name} launches.
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
                    Get credit for every contribution.<br />
                    <span style={{ color: 'var(--brand)' }}>Make your work impossible to miss.</span>
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    Join the waitlist for the only platform that tracks individual contributions in real time.
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

          <ScreenshotGallery />
        </div>
      </section>

      {/* Why This Matters */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(15,23,42,0.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, maxWidth: '960px', margin: '0 auto 1.5rem' }}>
            The only platform that makes every contribution{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              impossible to miss.
            </span>
          </h2>
          <p style={{ color: '#64748b', maxWidth: '680px', margin: '0 auto 3rem', fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', lineHeight: 1.6, fontWeight: 500 }}>
            Eliminate the guesswork. Espeezy provides the real-time data required to ensure every contribution is recognized and graded accurately.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: <GraduationCap size={22} />, stat: '73%', label: 'of students feel their individual effort is not accurately recognised in group assessments.' },
              { icon: <Users size={22} />, stat: '2.4B+', label: 'students worldwide will benefit from transparent, equitable collaboration tools.' },
              { icon: <TrendingUp size={22} />, stat: '3x', label: 'more likely to complete a course when accountability and recognition systems are in place.' },
              { icon: <Globe size={22} />, stat: '195', label: 'countries where equitable access to quality educational tools remains a critical gap.' },
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
            One mission: Eliminate group work free-riding. Join the thousands of students building a future where grades are earned, not shared.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#register" style={{ padding: '1rem 2.25rem', borderRadius: '12px', background: 'var(--brand)', color: 'white', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Register Now <ArrowRight size={18} />
            </a>
            <Link href="/fund" style={{ padding: '1rem 2.25rem', borderRadius: '12px', border: '1px solid rgba(15,23,42,0.15)', color: '#475569', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
              Speed up Development
            </Link>
          </div>
        </motion.div>
      </section>

      {submitted && <LiveChatWidget appScope='prereg' />}
      </main>
      </div>
    </>
    </MotionConfig>
  )
}
