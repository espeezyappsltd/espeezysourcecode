'use client'

import Link from 'next/link'
import { MotionConfig } from 'framer-motion'
import EspeezyMarketingBrand from '@shared/EspeezyMarketingBrand'
import { HERO_ANALYTICS_CAPTION, KANBAN_DEMO_PATH, MAIN_APP_ORIGIN } from '@shared/platform-brand'
import LaunchDataProvider from '@/components/LaunchDataProvider'
import LiveChatWidget from '@/components/LiveChatWidget'
import ScreenshotGallery from '@/components/ScreenshotGallery'
import PlatformHero from '@/components/landing/PlatformHero'
import AppUseCasesSection from '@/components/landing/AppUseCasesSection'
import LandingFeaturesSection from '@/components/landing/LandingFeaturesSection'
import AppsCatalog from '@/components/landing/AppsCatalog'
import { usePlatformApps } from '@/hooks/usePlatformApps'
import '@/components/landing/landing.css'

function LandingPageContent({ authUserCount }: { authUserCount: number }) {
  const { apps } = usePlatformApps()
  const kanbanDemoUrl = `${MAIN_APP_ORIGIN.replace(/\/$/, '')}${KANBAN_DEMO_PATH}`

  return (
    <>
      <nav
        aria-label="Primary navigation"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1rem, 4vw, 2.5rem)',
          borderBottom: '1px solid rgba(15,23,42,0.07)',
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255,255,255,0.92)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <EspeezyMarketingBrand variant="nav" />
        </Link>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link href="/#use-cases" className="landing-nav-link">
            Use cases
          </Link>
          <Link href="/#features" className="landing-nav-link">
            Features
          </Link>
          <Link href="/#apps" className="landing-nav-link">
            Apps
          </Link>
          <Link href="/checkout" className="landing-nav-link">
            Pricing
          </Link>
          <a href={MAIN_APP_ORIGIN} className="platform-app-card__btn platform-app-card__btn--primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
            Start free
          </a>
        </div>
      </nav>

      <main id="main-content">
        <PlatformHero
          apps={apps}
          kanbanAppUrl={MAIN_APP_ORIGIN}
          kanbanDemoUrl={kanbanDemoUrl}
          userCount={authUserCount}
        />

        <AppUseCasesSection apps={apps} />

        <LandingFeaturesSection />

        <section id="gallery" className="landing-section" aria-labelledby="gallery-heading">
          <div className="landing-inner">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p className="landing-eyebrow" style={{ marginBottom: '1rem' }}>
                {HERO_ANALYTICS_CAPTION}
              </p>
              <h2 id="gallery-heading" className="landing-title">
                See the workspace
              </h2>
              <p className="landing-lead">Screens from the live Kanban app — boards, teams, assets, and more.</p>
            </div>
            <ScreenshotGallery />
          </div>
        </section>

        <AppsCatalog apps={apps} />
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
