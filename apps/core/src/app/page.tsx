import { DEV_LINK_SECTIONS, LOCAL_APPS } from '@/lib/dev-links'
import { formatCopyrightNotice } from '@/lib/platform/brand-copy'
import DevLaunchHeroLogo from '@/components/DevLaunchHeroLogo'
import './local-server.css'

type LinkItem = {
  title: string
  description: string
  href: string
  external?: boolean
}

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function LinkCard({ title, description, href, external, accent }: LinkItem & { accent?: boolean }) {
  return (
    <a
      href={href}
      className={`local-server-card${accent ? ' local-server-app' : ''}`}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      <span className="local-server-card-title">
        {title}
        {external && <ExternalIcon />}
      </span>
      <span className="local-server-card-desc">{description}</span>
    </a>
  )
}

export default function LocalServerPage() {
  return (
    <div className="local-server">
      <div className="page-shell">
        <header className="local-server-hero">
          <div className="local-server-hero-inner">
            <DevLaunchHeroLogo />
            <p className="local-server-eyebrow">Local Server</p>
            <h1 className="local-server-title">Developer launchpad</h1>
            <p className="local-server-lead">
              Quick links to monorepo apps, official docs, web fundamentals, and curated tutorials. Bookmark this page
              while you build on the Espeezy stack.
            </p>
          </div>
        </header>

        <section className="local-server-section" aria-labelledby="local-apps-heading">
          <div className="local-server-section-head">
            <h2 id="local-apps-heading">Local monorepo apps</h2>
            <p>Default ports when started from the dev hub (customize per app in the hub UI).</p>
          </div>
          <div className="local-server-grid local-server-apps">
            {LOCAL_APPS.map((link) => (
              <LinkCard key={link.href} {...link} accent />
            ))}
          </div>
        </section>

        {DEV_LINK_SECTIONS.map((section) => (
          <section key={section.id} className="local-server-section" aria-labelledby={`section-${section.id}`}>
            <div className="local-server-section-head">
              <h2 id={`section-${section.id}`}>{section.title}</h2>
              <p>{section.subtitle}</p>
            </div>
            <div className="local-server-grid">
              {section.links.map((link) => (
                <LinkCard key={link.href} {...link} />
              ))}
            </div>
          </section>
        ))}

        <footer className="local-server-footer">
          <p>
            Running on <strong>apps/core</strong> · Part of the Espeezy monorepo · {formatCopyrightNotice({ product: 'Espeezy' })} · Start/stop from{' '}
            <a href="http://localhost:3000/dashboard" style={{ color: '#f472b6', fontWeight: 700 }}>
              Dev Hub
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
