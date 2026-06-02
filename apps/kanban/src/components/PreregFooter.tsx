'use client'

import {
  FOOTER_BRAND_BLURB,
  FOOTER_IMPORTANT_INFO,
  FOOTER_TECH_BLURB,
} from '@/lib/platform/brand-copy'
import FooterCopyrightNotice from '@shared/FooterCopyrightNotice'
import EspeezyMarketingBrand from '@shared/EspeezyMarketingBrand'
import { espeezyDocsUrl } from '@shared/espeezy-marketing-links'
import { ESPEEZY_APP_ORIGINS } from '@shared/espeezy-app-origins'

const PLATFORM_LINKS = [
  { href: ESPEEZY_APP_ORIGINS.prereg, label: 'Espeezy.com', external: true },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
  { href: '/demo', label: 'Kanban demo' },
]

const APPS_LINKS = [
  { href: ESPEEZY_APP_ORIGINS.games, label: 'Espeezy Games', external: true },
  { href: ESPEEZY_APP_ORIGINS.kanban, label: 'Espeezy Kanban', external: true },
  { href: ESPEEZY_APP_ORIGINS.studios, label: 'Espeezy Studio', external: true },
]

const DOCS_LINKS = [
  { href: espeezyDocsUrl('/docs'), label: 'Introduction', external: true },
  { href: espeezyDocsUrl('/docs/getting-started'), label: 'Quick Start', external: true },
  { href: espeezyDocsUrl('/docs/installation'), label: 'Installation', external: true },
  { href: espeezyDocsUrl('/docs/features/kanban'), label: 'Kanban Boards', external: true },
  { href: espeezyDocsUrl('/docs/features/roadmap'), label: 'Academic Roadmap', external: true },
  { href: espeezyDocsUrl('/docs/features/network'), label: 'Peer Network', external: true },
]

const INFRA_LINKS = [
  { href: espeezyDocsUrl('/docs/infra/presence'), label: 'Real-time Presence', external: true },
  { href: espeezyDocsUrl('/docs/infra/sync'), label: 'Supabase Sync', external: true },
  { href: espeezyDocsUrl('/docs/infra/payments'), label: 'Stripe Integration', external: true },
  { href: espeezyDocsUrl('/docs/vision'), label: 'Our Vision', external: true },
]

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: espeezyDocsUrl('/docs/refund-policy'), label: 'Refund Policy', external: true },
]

export default function PreregFooter() {
  return (
    <footer
      aria-label="Site footer"
      style={{
        background: '#0f172a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: '#94a3b8',
      }}
    >
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

          <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: '#475569', maxWidth: '240px' }}>{FOOTER_IMPORTANT_INFO}</p>
        </div>

        {[
          { title: 'Platform', links: PLATFORM_LINKS },
          { title: 'Apps', links: APPS_LINKS },
          { title: 'Documentation', links: DOCS_LINKS },
          { title: 'Infrastructure', links: INFRA_LINKS },
          { title: 'Legal', links: LEGAL_LINKS },
        ].map(({ title, links }) => (
          <div key={title}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e2e8f0', marginBottom: '1rem' }}>
              {title}
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {links.map(({ href, label, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem clamp(1.25rem, 4vw, 2.5rem)' }}>
        <FooterCopyrightNotice style={{ color: '#64748b', fontSize: '0.8rem' }} />
      </div>
    </footer>
  )
}
