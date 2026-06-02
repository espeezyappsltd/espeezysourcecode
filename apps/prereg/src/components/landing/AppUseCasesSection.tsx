'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { getPlatformAppUseCases } from '@shared/platform-app-use-cases'
import { platformAppProductPath, type PlatformApp } from '@shared/platform-apps'
import { PlatformAppIcon } from './platform-app-icon'
import './landing.css'

type Props = {
  apps: PlatformApp[]
}

export default function AppUseCasesSection({ apps }: Props) {
  const withUseCases = apps.filter((app) => getPlatformAppUseCases(app.slug))

  if (withUseCases.length === 0) return null

  return (
    <section id="use-cases" className="landing-section" aria-labelledby="use-cases-heading">
      <div className="landing-inner">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <p className="landing-eyebrow" style={{ marginBottom: '1rem' }}>
            Use cases
          </p>
          <h2 id="use-cases-heading" className="landing-title">
            Pick the app that fits your situation
          </h2>
          <p className="landing-lead">
            Espeezy learning apps are built for different jobs: group assignments, exam prep, freelance delivery, and self-hosting.
          </p>
        </div>

        <div className="use-cases-grid">
          {withUseCases.map((app, i) => {
            const useCase = getPlatformAppUseCases(app.slug)!
            return (
              <motion.article
                key={app.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="use-case-card"
                style={{ borderTopColor: app.accent_color }}
              >
                <div className="use-case-card__head">
                  <div
                    className="platform-app-card__icon"
                    style={{ background: `${app.accent_color}18`, color: app.accent_color }}
                  >
                    <PlatformAppIcon iconKey={app.icon_key} appSlug={app.slug} color={app.accent_color} />
                  </div>
                  <div>
                    <h3 className="use-case-card__name">{app.name}</h3>
                    <p className="use-case-card__audience">{useCase.audience}</p>
                  </div>
                </div>

                <ul className="use-case-card__list">
                  {useCase.scenarios.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>

                <div className="use-case-card__actions">
                  <Link href={platformAppProductPath(app.slug)} className="use-case-card__link">
                    Learn more
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                  {app.live_url ? (
                    <a href={app.live_url} target="_blank" rel="noopener noreferrer" className="use-case-card__link use-case-card__link--muted">
                      Open app
                    </a>
                  ) : null}
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
