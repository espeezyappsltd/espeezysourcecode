'use client'

const PLATFORM_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/checkout', label: 'Pricing' },
  { href: '/fund', label: 'Support Us' },
  { href: '/contact', label: 'Contact' },
]

const APPS_LINKS = [
  { href: 'https://games.espeezy.com', label: 'Espeezy Games', external: true },
  { href: 'https://kanban.espeezy.com', label: 'Espeezy Kanban', external: true },
]

const DOCS_LINKS = [
  { href: '/docs', label: 'Introduction' },
  { href: '/docs/getting-started', label: 'Quick Start' },
  { href: '/docs/installation', label: 'Installation' },
  { href: '/docs/features/kanban', label: 'Kanban Boards' },
  { href: '/docs/features/roadmap', label: 'Academic Roadmap' },
  { href: '/docs/features/network', label: 'Peer Network' },
  { href: '/docs/features/marketplace', label: 'Marketplace' },
  { href: '/docs/features/skirmish', label: 'Skirmish Games' },
  { href: '/docs/features/search', label: 'Smart Search' },
]

const INFRA_LINKS = [
  { href: '/docs/infra/presence', label: 'Real-time Presence'  },
  { href: '/docs/infra/sync', label: 'Supabase Sync'  },
  { href: '/docs/infra/payments', label: 'Stripe Integration' },
  { href: '/docs/vision', label: 'Our Vision' },
  { href: '/docs/impact', label: 'Impact Stats' },
]

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: 'https://espeezy.com/docs/refund-policy', label: 'Refund Policy' },
  { href: '/fund', label: 'Donate' },
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
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand_logo2.svg"
                width={20}
                height={20}
                style={{ objectFit: 'contain' }}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1rem', color: '#f1f5f9', letterSpacing: '-0.01em' }}>Espeezy</span>
          </div>

          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#64748b', marginBottom: '1.5rem', maxWidth: '240px' }}>
            The collaborative education platform built for equitable collaboration. Every student gets credit
            for the work they actually do. Free, open, and made for real group projects.
          </p>

          <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#475569', marginBottom: '1rem', maxWidth: '240px' }}>
            Built on Next.js and Supabase. Integrates with Canvas, Blackboard, and Moodle.
            Payments via Stripe. Real-time sync across all your devices.
          </p>

          <div
            style={{
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(15,23,42,0.5)',
              borderRadius: '10px',
              padding: '0.75rem',
              marginBottom: '1rem',
              maxWidth: '260px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Important Info
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.76rem', lineHeight: 1.5, color: '#94a3b8' }}>
              Support: support@espeezy.com
              <br />
              Payments are processed by Stripe.
              <br />
              Core student tier stays free.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem',
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              borderRadius: '4px', letterSpacing: '0.05em',
            }}>
              OPEN ACCESS
            </span>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem',
              background: 'rgba(99,102,241,0.12)', color: '#818cf8',
              borderRadius: '4px', letterSpacing: '0.05em',
            }}>
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
              <li key={href}>
                <a
                  href={href}
                  style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  {label}
                </a>
              </li>
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
              <li key={href}>
                <a
                  href={href}
                  style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  {label}
                </a>
              </li>
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
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  {label}
                  <span style={{ fontSize: '0.65rem', opacity: 0.5 }}> - </span>
                </a>
              </li>
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
              <li key={href}>
                <a
                  href={href}
                  style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '1.25rem' }}>
            Legal
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {LEGAL_LINKS.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  {label}
                </a>
              </li>
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
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <p style={{ fontSize: '0.78rem', color: '#334155', margin: 0 }}>
          &copy; {new Date().getFullYear()} Espeezy. All rights reserved.
          Built for students, by people who remember how hard group projects can be.
        </p>
        <p style={{ fontSize: '0.78rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
          Free forever for students &middot; No data sold &middot; Open roadmap
        </p>
      </div>
    </footer>
  )
}
