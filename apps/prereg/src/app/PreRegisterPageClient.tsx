'use client'

import Link from 'next/link'
import { MotionConfig } from 'framer-motion'
import EspeezyMarketingBrand from '@shared/EspeezyMarketingBrand'
import { HERO_ANALYTICS_CAPTION } from '@shared/platform-brand'
import LaunchDataProvider from '@/components/LaunchDataProvider'
import LiveChatWidget from '@/components/LiveChatWidget'
import ScreenshotGallery from '@/components/ScreenshotGallery'
import PlatformHero from '@/components/landing/PlatformHero'
import AppUseCasesSection from '@/components/landing/AppUseCasesSection'
import LandingFeaturesSection from '@/components/landing/LandingFeaturesSection'
import { usePlatformApps } from '@/hooks/usePlatformApps'
import '@/components/landing/landing.css'

function LandingPageContent({ authUserCount }: { authUserCount: number }) {
  const { apps } = usePlatformApps()

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
          <Link href="/login" className="landing-nav-link">
            Log in
          </Link>
          <Link href="/login?mode=signup" className="landing-nav-link">
            Sign up
          </Link>
        </div>
      </nav>

      <main id="main-content">
        <PlatformHero
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
