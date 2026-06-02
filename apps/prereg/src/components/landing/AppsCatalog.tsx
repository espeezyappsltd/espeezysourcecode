'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import {
  PLATFORM_APP_STATUS_LABEL,
  platformAppProductPath,
  type PlatformApp,
} from '@shared/platform-apps'
import { PlatformAppIcon } from './platform-app-icon'
import './landing.css'

type Props = {
  apps: PlatformApp[]
}

export default function AppsCatalog({ apps }: Props) {
  return (
    <section id="apps" className="landing-section landing-section--muted">
      <div className="landing-inner">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <p className="landing-eyebrow" style={{ marginBottom: '1rem' }}>
            Production apps
          </p>
          <h2 className="landing-title">Apps on espeezy.com</h2>
          <p className="landing-lead">
            Each app runs on its own hostname. Sign in once and open Kanban, Games, Studio, Articles, or Dev Launch.
          </p>
        </div>

        <div className="platform-apps-grid">
          {apps.map((app, i) => {
            const productHref = platformAppProductPath(app.slug)

            return (
              <motion.article
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="platform-app-card"
                style={{ borderTop: `3px solid ${app.accent_color}` }}
              >
                <div className="platform-app-card__head">
                  <div
                    className="platform-app-card__icon"
                    style={{ background: `${app.accent_color}18`, color: app.accent_color }}
                  >
                    <PlatformAppIcon iconKey={app.icon_key} appSlug={app.slug} color={app.accent_color} />
                  </div>
                  <span className={`platform-app-card__status platform-app-card__status--${app.status}`}>
                    {PLATFORM_APP_STATUS_LABEL[app.status]}
                  </span>
                </div>

                <h3 className="platform-app-card__name">{app.name}</h3>
                <p className="platform-app-card__tagline">{app.tagline}</p>

                {app.features.length > 0 && (
                  <ul style={{ margin: '0 0 1rem', paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.55 }}>
                    {app.features.slice(0, 4).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}

                <div className="platform-app-card__actions">
                  {app.live_url ? (
                    <a
                      href={app.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="platform-app-card__btn platform-app-card__btn--primary"
                    >
                      <ExternalLink size={14} aria-hidden />
                      Open app
                    </a>
                  ) : null}

                  <Link href={productHref} className="platform-app-card__btn platform-app-card__btn--ghost">
                    About this app
                  </Link>
                </div>
              </motion.article>
            )
          })}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          <Link href="/docs/apps" className="landing-inline-link">
            Docs for every app →
          </Link>
        </p>
      </div>
    </section>
  )
}
