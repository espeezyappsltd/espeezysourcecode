'use client'

import Link from 'next/link'
import { MotionConfig } from 'framer-motion'
import EspeezyMarketingBrand from '@shared/EspeezyMarketingBrand'
import { buildKanbanAppUrl } from '@shared/app-url'
import { useSessionUser } from '@shared/useSessionUser'
import { supabase } from '@/lib/supabase-client'
import LaunchDataProvider from '@/components/LaunchDataProvider'
import LiveChatWidget from '@/components/LiveChatWidget'
import PlatformHero from '@/components/landing/PlatformHero'
import LandingAppsSection from '@/components/landing/LandingAppsSection'
import '@/components/landing/landing.css'

function LandingPageContent({ authUserCount }: { authUserCount: number }) {
  const { user, loading } = useSessionUser(supabase)
  const signedIn = !loading && !!user

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="landing-nav"
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <EspeezyMarketingBrand variant="nav" />
        </Link>
        <div className="landing-nav__links">
          <a href="#apps" className="landing-nav-link">Apps</a>
          <Link href="/docs" className="landing-nav-link">Docs</Link>
          <Link href="/checkout" className="landing-nav-link">Pricing</Link>
          {signedIn ? (
            <a href={buildKanbanAppUrl('/')} className="landing-nav-link landing-nav-link--accent">
              Dashboard
            </a>
          ) : (
            <>
              <Link href="/login" className="landing-nav-link">Log in</Link>
              <Link href="/login?mode=signup" className="landing-nav-link landing-nav-link--accent">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main id="main-content">
        <PlatformHero userCount={authUserCount} />
        <LandingAppsSection />
        <section className="landing-section landing-section--compact" aria-label="More information">
          <div className="landing-inner" style={{ textAlign: 'center' }}>
            <p className="landing-lead" style={{ margin: 0, fontSize: '0.9rem' }}>
              Need setup help or product screens?{' '}
              <Link href="/docs/getting-started" className="landing-inline-link">Quick start</Link>
              {' · '}
              <Link href="/docs/features/kanban" className="landing-inline-link">Kanban guide</Link>
            </p>
          </div>
        </section>
      </main>

      <LiveChatWidget appScope="prereg" />
    </>
  )
}

export default function PreRegisterPageClient() {
  return (
    <LaunchDataProvider>
      {({ authUserCount }) => (
        <MotionConfig reducedMotion="user">
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: 'radial-gradient(rgba(99,102,241,0.05) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <LandingPageContent authUserCount={authUserCount} />
            </div>
          </div>
        </MotionConfig>
      )}
    </LaunchDataProvider>
  )
}
