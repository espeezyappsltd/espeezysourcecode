'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, MotionConfig } from 'framer-motion'
import type { Session, User } from '@supabase/supabase-js'
import {
  ArrowRight, Users, Globe,
  BookOpen, Cpu, Zap, BarChart2,
  GraduationCap, TrendingUp,
} from 'lucide-react'
import { useLaunchData } from '@/hooks/useLaunchData'
import LiveChatWidget from '@/components/LiveChatWidget'
import ScreenshotGallery from '@/components/ScreenshotGallery'
import { SCREENSHOT_ASSETS } from '@shared/assets'
import {
  HERO_ANALYTICS_CAPTION,
  KANBAN_DEMO_PATH,
} from '@shared/platform-brand'
import { PLATFORM_APPS_FALLBACK, type PlatformApp } from '@shared/platform-apps'
import PlatformHero from '@/components/landing/PlatformHero'
import AppsCatalog from '@/components/landing/AppsCatalog'
import { buildCrossAppSsoUrl, GAMES_PROFILE_PATH } from '@shared/cross-app-auth'

function HeroVisual({ userCount }: { userCount: number }) {
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
          {userCount > 0 ? (
            <>Join <span style={{ color: 'var(--brand)' }}>{userCount.toLocaleString()}</span> students using Espeezy</>
          ) : (
            <>Built for student project teams</>
          )}
        </span>
      </motion.div>

      {/* Screenshot Layout */}
      <div style={{ position: 'relative', height: 'clamp(300px, 50vw, 500px)', width: '100%', perspective: '1000px' }}>
        
        {/* Landscape Main: Analytics Dashboard (key hook) */}
        <motion.div
          initial={{ opacity: 0, rotateX: 10, y: 40 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ 
            position: 'absolute', inset: 0, zIndex: 5, borderRadius: '24px', overflow: 'hidden', 
            border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 30px 60px rgba(15,23,42,0.15)',
            background: '#0f172a'
          }}
        >
          <Image 
            src="/screenshotshero_sv"
            alt="Hero Screenshot"
            fill
            sizes="(max-width: 1024px) 100vw, 800px"
            quality={55}
            priority
            style={{ objectFit: 'cover', objectPosition: 'top center' }} 
          />
          <div
            style={{
              position: 'absolute',
              left: '1rem',
              bottom: '1rem',
              zIndex: 6,
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(15,23,42,0.82)',
              border: '1px solid rgba(16,185,129,0.35)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6ee7b7' }}>
              {HERO_ANALYTICS_CAPTION}
            </span>
          </div>
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

const COMING_FEATURES = [
  { icon: <Zap size={20} />, title: 'One place for the project', desc: 'Boards, shared docs, and group chat together, so your team stops switching between apps to get work done.', tag: 'Productivity' },
  { icon: <BarChart2 size={20} />, title: 'Proof of who did the work', desc: 'Every task and edit is logged. Export it as a record you can show graders, recruiters, and teammates.', tag: 'Visibility' },
  { icon: <BookOpen size={20} />, title: 'Works with your LMS', desc: 'Connect Canvas, Blackboard, or Moodle so assignments, deadlines, and grades show up in Espeezy automatically.', tag: 'Integrations' },
  { icon: <GraduationCap size={20} />, title: 'Better study groups', desc: 'Get matched with classmates whose strengths complement yours, so group work actually works.', tag: 'Collaboration' },
  { icon: <TrendingUp size={20} />, title: 'See how work is split', desc: 'A clear view of who is doing what and where a project is stalling, so nothing slips through the cracks.', tag: 'Insights' },
  { icon: <Cpu size={20} />, title: 'Tips to do better next time', desc: 'Personalised suggestions on where you contribute most and how to improve on your next project.', tag: 'Insights' },
  { icon: <Globe size={20} />, title: 'Find collaborators anywhere', desc: 'A verified, students-only network to share resources and team up with people at other campuses.', tag: 'Community' },
  { icon: <Users size={20} />, title: 'Marketplace & credits', desc: 'Trade digital assets for Espeezy Credits and spend them on Pro features.', tag: 'Opportunities' },
]

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#apps', label: 'Apps' },
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
]

export default function PreRegisterPage() {
  const { config, authUserCount } = useLaunchData()
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'premium' | 'unknown'>('unknown')
  const [platformApps, setPlatformApps] = useState<PlatformApp[]>(PLATFORM_APPS_FALLBACK)

  const kanbanBaseUrl = process.env.NEXT_PUBLIC_KANBAN_APP_URL ?? 'https://kanban.espeezy.com'
  const gamesBaseUrl = process.env.NEXT_PUBLIC_GAMES_APP_URL ?? 'https://games.espeezy.com'

  const buildSsoUrl = (appBaseUrl: string, nextPath: string) =>
    buildCrossAppSsoUrl(
      appBaseUrl,
      nextPath,
      session?.access_token && session.refresh_token
        ? { access_token: session.access_token, refresh_token: session.refresh_token }
        : null,
    )

  const kanbanSsoUrl = buildSsoUrl(kanbanBaseUrl, '/')
  const kanbanDemoUrl = `${kanbanBaseUrl.replace(/\/$/, '')}${KANBAN_DEMO_PATH}`
  const gamesSsoUrl = buildSsoUrl(gamesBaseUrl, GAMES_PROFILE_PATH)

  useEffect(() => {
    void fetch('/api/platform-apps')
      .then((r) => r.json())
      .then((data: { apps?: PlatformApp[] }) => {
        if (Array.isArray(data.apps) && data.apps.length > 0) {
          setPlatformApps(data.apps)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let mounted = true

    const applyTier = (tier: string | undefined) => {
      if (tier === 'pro' || tier === 'premium' || tier === 'free') {
        setUserTier(tier)
      } else {
        setUserTier('free')
      }
    }

    const refreshTier = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', userId)
          .maybeSingle()
        if (!mounted) return
        applyTier((profile as { tier?: string } | null)?.tier)
      } catch {
        if (mounted) setUserTier('free')
      }
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        refreshTier(session.user.id)
      } else {
        setUserTier('unknown')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setSession(session)
      setAuthUser(session?.user ?? null)

      if (!session?.user) {
        setUserTier('unknown')
        return
      }

      refreshTier(session.user.id)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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
        <a href={kanbanSsoUrl} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: 'var(--brand)', fontSize: '0.8rem', fontWeight: 800, color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Start Free
        </a>
      </nav>

      <main id="main-content">
      <PlatformHero apps={platformApps} kanbanAppUrl={kanbanSsoUrl} kanbanDemoUrl={kanbanDemoUrl} userCount={authUserCount} />

      <section style={{ padding: '2rem clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <HeroVisual userCount={authUserCount} />
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
                  Upgrade to Pro to play Games
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      <AppsCatalog apps={platformApps} />

      {/* Product Gallery */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(15,23,42,0.07)', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1rem' }}>
              Get a first look at the product.
            </h2>
            <p style={{ color: '#64748b', maxWidth: '620px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
              Built for students, educators, and the teams they work in.
            </p>
          </div>

          <ScreenshotGallery />
        </div>
      </section>

      {/* Why This Matters */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(15,23,42,0.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, maxWidth: '960px', margin: '0 auto 1.5rem' }}>
            A shared record that makes every contribution{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              easy to see.
            </span>
          </h2>
          <p style={{ color: '#64748b', maxWidth: '680px', margin: '0 auto 3rem', fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', lineHeight: 1.6, fontWeight: 500 }}>
            Less guesswork for teams and educators. Espeezy keeps a clear contribution history that becomes an academic record for grades, portfolios, and employers.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: <GraduationCap size={22} />, stat: '73%', label: 'of students feel their individual effort is not accurately recognised in group assessments.' },
              { icon: <Users size={22} />, stat: '2.4B+', label: 'students worldwide could benefit from group-work tools with academic records for résumés and skill proof.' },
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
              What&apos;s coming next.
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
            Get credit for<br /><span style={{ color: 'var(--brand)' }}>your work.</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Run group projects on a shared board, keep a record of who did what, and export proof for graders, recruiters, and teammates. Free for students.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={kanbanSsoUrl} style={{ padding: '1rem 2.25rem', borderRadius: '12px', background: 'var(--brand)', color: 'white', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Start Free <ArrowRight size={18} />
            </a>
            <Link href="/pricing" style={{ padding: '1rem 2.25rem', borderRadius: '12px', border: '1px solid rgba(15,23,42,0.15)', color: '#475569', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
              View Plans
            </Link>
          </div>
        </motion.div>
      </section>

      <LiveChatWidget appScope='prereg' />
      </main>
      </div>
    </>
    </MotionConfig>
  )
}
