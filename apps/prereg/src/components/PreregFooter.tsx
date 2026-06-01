'use client'

import { FOOTER_BRAND_BLURB, FOOTER_SUPPORT_LINE } from '@shared/platform-brand'
import FooterCopyrightNotice from '@shared/FooterCopyrightNotice'
import { ESPEEZY_PUBLIC_APP_LINKS } from '@shared/espeezy-apps-catalog'
import EspeezyMarketingBrand from '@shared/EspeezyMarketingBrand'

const PLATFORM_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#apps', label: 'Apps' },
  { href: '/docs', label: 'Docs' },
  { href: '/checkout', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
]

const DOCS_LINKS = [
  { href: '/docs', label: 'Introduction' },
  { href: '/docs/apps', label: 'Apps in use' },
  { href: '/docs/getting-started', label: 'Quick start' },
  { href: '/docs/features/kanban', label: 'Kanban' },
  { href: '/docs/installation', label: 'Installation' },
]

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/docs/refund-policy', label: 'Refunds' },
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
          padding: 'clamp(2.5rem, 5vw, 3.5rem) clamp(1.25rem, 4vw, 2.5rem) 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '2rem 2rem',
        }}
      >
        <div style={{ gridColumn: '1 / -1', maxWidth: '320px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <EspeezyMarketingBrand variant="nav" />
          </div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: '#64748b', margin: '0 0 0.5rem' }}>
            {FOOTER_BRAND_BLURB}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>{FOOTER_SUPPORT_LINE}</p>
        </div>

        <FooterColumn title="Site" links={PLATFORM_LINKS} />
        <FooterColumn title="Docs" links={DOCS_LINKS} />
        <FooterColumn title="Apps" links={APPS_LINKS} external />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '1.25rem clamp(1.25rem, 4vw, 2.5rem)',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <FooterCopyrightNotice style={{ color: '#475569' }} />
      </div>
    </footer>
  )
}

const APPS_LINKS = ESPEEZY_PUBLIC_APP_LINKS

function FooterColumn({
  title,
  links,
  external,
}: {
  title: string
  links: { href: string; label: string; external?: boolean }[]
  external?: boolean
}) {
  return (
    <div>
      <h3
        style={{
          fontSize: '0.7rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#475569',
          marginBottom: '1rem',
        }}
      >
        {title}
      </h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {links.map(({ href, label }) => (
          <li key={href}>
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
