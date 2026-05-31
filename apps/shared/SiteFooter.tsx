'use client'

import { ESPEEZY_PUBLIC_APP_LINKS } from './espeezy-apps-catalog'
import EspeezyMarketingBrand from './EspeezyMarketingBrand'

const PLATFORM_LINKS = [
  { href: 'https://espeezy.com', label: 'Home' },
  { href: 'https://espeezy.com/#apps', label: 'Apps' },
  { href: 'https://espeezy.com/#features', label: 'Features' },
  { href: 'https://espeezy.com/checkout', label: 'Pricing' },
  { href: 'https://espeezy.com/contact', label: 'Contact' },
]

const APPS_LINKS = ESPEEZY_PUBLIC_APP_LINKS

const DOCS_LINKS = [
  { href: 'https://espeezy.com/docs', label: 'Introduction' },
  { href: 'https://espeezy.com/docs/getting-started', label: 'Quick Start' },
  { href: 'https://espeezy.com/docs/installation', label: 'Installation' },
  { href: 'https://espeezy.com/docs/features/kanban', label: 'Kanban Boards' },
  { href: 'https://espeezy.com/docs/features/roadmap', label: 'Academic Roadmap' },
  { href: 'https://espeezy.com/docs/features/network', label: 'Peer Network' },
  { href: 'https://espeezy.com/docs/features/marketplace', label: 'Marketplace' },
  { href: 'https://espeezy.com/docs/features/skirmish', label: 'Skirmish Games' },
  { href: 'https://espeezy.com/docs/features/search', label: 'Smart Search' },
]

const INFRA_LINKS = [
  { href: 'https://espeezy.com/docs/infra/payments', label: 'Stripe Integration' },
  { href: 'https://espeezy.com/docs/infra/sync', label: 'Supabase Sync' },
  { href: 'https://espeezy.com/docs/infra/presence', label: 'Real-time Presence' },
  { href: 'https://espeezy.com/docs/vision', label: 'Our Vision' },
  { href: 'https://espeezy.com/docs/impact', label: 'Impact Stats' },
]

const LEGAL_LINKS = [
  { href: 'https://espeezy.com/terms', label: 'Terms of Service' },
  { href: 'https://espeezy.com/privacy', label: 'Privacy Policy' },
  { href: 'https://espeezy.com/docs/refund-policy', label: 'Refund Policy' },
]

import { useCentralLoading } from './CentralLoadingProvider'
import {
  FOOTER_BRAND_BLURB,
  FOOTER_TECH_BLURB,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from './platform-brand'
import FooterCopyrightNotice from './FooterCopyrightNotice'

function FooterLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  const { startLoading } = useCentralLoading();
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
      onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
      onClick={e => {
        // Only trigger loader for internal links
        if (!external && href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('#')) {
          startLoading('Navigating...')
        }
      }}
    >
      {children}
      {external && <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>↗</span>}
    </a>
  )
}

export default function SiteFooter() {
  return (
    <footer
      aria-label="Site footer"
      style={{
        background: '#0f172a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: '#94a3b8',
      }}
    >
      {/* Main columns */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1.25rem, 4vw, 2.5rem) clamp(2rem, 4vw, 3rem)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem 2.5rem',
        }}
      >
        {/* Brand */}
        <div style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <EspeezyMarketingBrand variant="nav" />
          </div>

          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#64748b', marginBottom: '1.5rem', maxWidth: '240px' }}>
            {FOOTER_BRAND_BLURB}
          </p>

          <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#475569', marginBottom: '1rem', maxWidth: '240px' }}>
            {FOOTER_TECH_BLURB}
          </p>

          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#64748b', marginBottom: '1.5rem' }}>
            Call us:{' '}
            <a href={`tel:${SUPPORT_PHONE_TEL}`} style={{ color: '#94a3b8', fontWeight: 700, textDecoration: 'none' }}>
              {SUPPORT_PHONE}
            </a>
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '4px', letterSpacing: '0.05em' }}>
              OPEN ACCESS
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', background: 'rgba(99,102,241,0.12)', color: '#818cf8', borderRadius: '4px', letterSpacing: '0.05em' }}>
              EARLY ACCESS
            </span>
          </div>
        </div>

        {/* Platform */}
        <div>
          <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '1.25rem' }}>
            Platform
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {PLATFORM_LINKS.map(({ href, label }) => (
              <li key={href}><FooterLink href={href}>{label}</FooterLink></li>
            ))}
          </ul>
        </div>

        {/* Docs */}
        <div>
          <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '1.25rem' }}>
            Documentation
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {DOCS_LINKS.map(({ href, label }) => (
              <li key={href}><FooterLink href={href}>{label}</FooterLink></li>
            ))}
          </ul>
        </div>

        {/* Apps */}
        <div>
          <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '1.25rem' }}>
            Apps
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {APPS_LINKS.map(({ href, label }) => (
              <li key={href}><FooterLink href={href} external>{label}</FooterLink></li>
            ))}
          </ul>
        </div>

        {/* Infrastructure + Legal */}
        <div>
          <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '1.25rem' }}>
            Infrastructure &amp; Vision
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
            {INFRA_LINKS.map(({ href, label }) => (
              <li key={href}><FooterLink href={href}>{label}</FooterLink></li>
            ))}
          </ul>

          <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '1.25rem' }}>
            Legal
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {LEGAL_LINKS.map(({ href, label }) => (
              <li key={href}><FooterLink href={href}>{label}</FooterLink></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '1.5rem clamp(1.25rem, 4vw, 2.5rem)',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <FooterCopyrightNotice showTrademark />
      </div>
    </footer>
  )
}
