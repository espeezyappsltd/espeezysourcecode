'use client'

import Link from 'next/link'
import { ArrowLeft, Check, Download, ExternalLink, ShoppingCart } from 'lucide-react'
import {
  formatPlatformAppPrice,
  PLATFORM_APP_STATUS_LABEL,
  type PlatformApp,
} from '@shared/platform-apps'
import { CHECKOUT_TEAM_NOTE } from '@shared/platform-brand'
import { getPlatformAppUseCases } from '@shared/platform-app-use-cases'
import { PlatformAppIcon } from './platform-app-icon'
import EspeezyAppLogo from '@shared/EspeezyAppLogo'
import './landing.css'

type Props = {
  app: PlatformApp
}

function renderMarkdownBlock(md: string) {
  if (!md.trim()) return null
  return <div className="setup-md">{md.trim()}</div>
}

export default function AppProductClient({ app }: Props) {
  const price = formatPlatformAppPrice(app)
  const useCase = getPlatformAppUseCases(app.slug)
  const hasStripe = Boolean(app.stripe_payment_link?.trim())
  const hasDownload = Boolean(app.download_url?.trim())
  const isDev = app.status === 'development' || app.status === 'coming_soon'

  return (
    <div className="product-page">
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem clamp(1rem, 4vw, 2.5rem)',
          borderBottom: '1px solid rgba(15,23,42,0.08)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>
          <ArrowLeft size={18} aria-hidden />
          Espeezy
        </Link>
        <Link href="/#apps" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
          All apps
        </Link>
      </nav>

      <header className="product-hero" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            margin: '0 auto 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${app.accent_color}18`,
          }}
        >
          <PlatformAppIcon iconKey={app.icon_key} appSlug={app.slug} size={28} color={app.accent_color} />
        </div>
        <span className={`platform-app-card__status platform-app-card__status--${app.status}`}>
          {PLATFORM_APP_STATUS_LABEL[app.status]}
        </span>
        <h1 style={{ margin: '1rem 0 0.5rem', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 950, letterSpacing: '-0.04em' }}>
          {app.name}
        </h1>
        <p style={{ margin: '0 auto', maxWidth: 640, color: '#64748b', lineHeight: 1.6 }}>{app.description || app.tagline}</p>
        <p style={{ margin: '1.25rem 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{price}</p>

        <div className="product-cta-bar" style={{ justifyContent: 'center' }}>
          {hasStripe && !isDev && (
            <a
              href={app.stripe_payment_link!}
              target="_blank"
              rel="noopener noreferrer"
              className="platform-app-card__btn platform-app-card__btn--primary"
              style={{ padding: '0.9rem 1.5rem', fontSize: '0.95rem' }}
            >
              <ShoppingCart size={18} aria-hidden />
              Pay &amp; download — one click
            </a>
          )}
          {hasDownload && (
            <a
              href={app.download_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="platform-app-card__btn platform-app-card__btn--ghost"
              style={{ padding: '0.9rem 1.5rem', fontSize: '0.95rem' }}
            >
              <Download size={18} aria-hidden />
              Download package
            </a>
          )}
          {!hasStripe && !isDev && app.price_cents > 0 && (
            <Link href="/contact" className="platform-app-card__btn platform-app-card__btn--primary" style={{ padding: '0.9rem 1.5rem' }}>
              Contact sales for license
            </Link>
          )}
          {app.live_url && (
            <a
              href={app.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="platform-app-card__btn platform-app-card__btn--ghost"
              style={{ padding: '0.9rem 1.5rem' }}
            >
              <ExternalLink size={18} aria-hidden />
              Open hosted app
            </a>
          )}
        </div>

        <p style={{ margin: '1.5rem auto 0', maxWidth: 520, fontSize: '0.78rem', color: '#94a3b8' }}>
          {CHECKOUT_TEAM_NOTE}
          {app.includes_source ? ' · Full source included with license.' : ''}
        </p>
      </header>

      <div className="product-setup">
        {useCase ? (
          <>
            <h2>Who it&apos;s for</h2>
            <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 1rem' }}>{useCase.audience}</p>
            <h2>Common situations</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {useCase.scenarios.map((line) => (
                <li key={line} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#475569', fontSize: '0.9rem' }}>
                  <Check size={16} color="var(--brand)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {app.features.length > 0 && (
          <>
            <h2>What&apos;s included</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {app.features.map((f) => (
                <li key={f} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#475569', fontSize: '0.9rem' }}>
                  <Check size={16} color="var(--brand)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </>
        )}

        {app.setup_sections.map((section) => (
          <div key={section.title}>
            <h2>{section.title}</h2>
            <ol>
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}

        {app.db_setup_markdown.trim() && (
          <>
            <h2>Run your own database</h2>
            {renderMarkdownBlock(app.db_setup_markdown)}
          </>
        )}

        {app.ui_customization_markdown.trim() && (
          <>
            <h2>UI personalisation</h2>
            {renderMarkdownBlock(app.ui_customization_markdown)}
          </>
        )}

        {!app.db_setup_markdown.trim() && !app.ui_customization_markdown.trim() && app.setup_sections.length === 0 && (
          <p style={{ color: '#64748b', lineHeight: 1.6 }}>
            Setup documentation for this app is being finalised.{' '}
            <Link href="/docs/installation" style={{ color: 'var(--brand)' }}>
              See general installation docs
            </Link>{' '}
            or email support@espeezy.com after purchase.
          </p>
        )}

        <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 16, border: '1px solid rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <EspeezyAppLogo app="marketing" variant="mark" aria-hidden />
            <strong>Need help deploying?</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
            Our platform team supports school, team, and organization deployments. After checkout you receive download access and can follow the steps above
            to point the app at your Supabase project and brand assets.
          </p>
          <Link href="/contact" style={{ display: 'inline-block', marginTop: '1rem', fontWeight: 700, color: 'var(--brand)' }}>
            Contact support →
          </Link>
        </div>
      </div>
    </div>
  )
}
