'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Download, ExternalLink, ShoppingCart } from 'lucide-react'
import {
  formatPlatformAppPrice,
  PLATFORM_APP_STATUS_LABEL,
  platformAppProductPath,
  type PlatformApp,
} from '@shared/platform-apps'
import { PlatformAppIcon } from './platform-app-icon'
import './landing.css'

type Props = {
  apps: PlatformApp[]
}

function canPurchase(app: PlatformApp): boolean {
  return app.price_cents > 0 && Boolean(app.stripe_payment_link)
}

function canDirectDownload(app: PlatformApp): boolean {
  return Boolean(app.download_url)
}

export default function AppsCatalog({ apps }: Props) {
  return (
    <section id="apps" className="landing-section landing-section--muted">
      <div className="landing-inner">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <p className="landing-eyebrow" style={{ marginBottom: '1rem' }}>
            Apps catalog
          </p>
          <h2 className="landing-title">Every app. Its own license.</h2>
          <p className="landing-lead">
            One-click to pay and download self-host packages, or open our hosted cloud. Each product ships with database
            setup and UI personalisation guides.
          </p>
        </div>

        <div className="platform-apps-grid">
          {apps.map((app, i) => {
            const productHref = platformAppProductPath(app.slug)
            const price = formatPlatformAppPrice(app)
            const purchasable = canPurchase(app)
            const downloadable = canDirectDownload(app)

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
                    <PlatformAppIcon iconKey={app.icon_key} color={app.accent_color} />
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

                <div className="platform-app-card__price">{price}</div>

                <div className="platform-app-card__actions">
                  {purchasable ? (
                    <a
                      href={app.stripe_payment_link!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="platform-app-card__btn platform-app-card__btn--primary"
                    >
                      <ShoppingCart size={14} aria-hidden />
                      Pay &amp; download
                    </a>
                  ) : (
                    <Link href={productHref} className="platform-app-card__btn platform-app-card__btn--primary">
                      <ShoppingCart size={14} aria-hidden />
                      {app.price_cents > 0 ? 'View pay page' : 'Get details'}
                    </Link>
                  )}

                  {downloadable && (
                    <a
                      href={app.download_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="platform-app-card__btn platform-app-card__btn--ghost"
                    >
                      <Download size={14} aria-hidden />
                      Download
                    </a>
                  )}

                  {app.live_url && (
                    <a
                      href={app.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="platform-app-card__btn platform-app-card__btn--ghost"
                    >
                      <ExternalLink size={14} aria-hidden />
                      Hosted
                    </a>
                  )}

                  <Link href={productHref} className="platform-app-card__btn platform-app-card__btn--ghost">
                    Setup guide
                  </Link>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
