'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { HERO_COPY_LINES, KANBAN_DEMO_LABEL, KANBAN_DEMO_URL } from '@shared/platform-brand'
import { productionAppsForConsumerDocs } from '@shared/platform-production-catalog'
import './landing.css'

const HERO_APPS = productionAppsForConsumerDocs()

const motionEase = [0.22, 1, 0.36, 1] as const

type Props = {
  userCount: number
}

export default function PlatformHero({ userCount }: Props) {
  return (
    <section id="hero" className="landing-hero" aria-labelledby="hero-heading">
      <div className="landing-hero__backdrop" aria-hidden />

      <div className="landing-hero__inner">
        <motion.div
          className="landing-hero__copy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: motionEase }}
        >
          <div className="landing-eyebrow">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--brand)',
                boxShadow: '0 0 8px var(--brand)',
              }}
              aria-hidden
            />
            Learning apps
          </div>

          <h1 id="hero-heading" className="landing-hero__title">
            {HERO_COPY_LINES[0]}
          </h1>
          <p className="landing-hero__lead">{HERO_COPY_LINES[1]}</p>

          {userCount > 0 ? (
            <p className="landing-hero__stat">
              <strong>{userCount.toLocaleString()}</strong>{' '}
              {userCount === 1 ? 'user' : 'users'} on Espeezy
            </p>
          ) : null}
        </motion.div>

        <motion.div
          className="landing-hero__cluster"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: motionEase }}
        >
          <div className="landing-hero-actions">
            <a href="/login" className="platform-app-card__btn platform-app-card__btn--primary">
              Log in
              <ArrowRight size={16} aria-hidden />
            </a>
            <Link href="/login?mode=signup" className="platform-app-card__btn platform-app-card__btn--ghost">
              Sign up
            </Link>
          </div>

          <nav aria-label="Quick links" className="landing-hero-quicklinks">
            <a href="#apps">Apps</a>
            <a href={KANBAN_DEMO_URL} rel="noopener noreferrer">
              {KANBAN_DEMO_LABEL}
            </a>
            <Link href="/docs">Docs</Link>
            <Link href="/checkout">Pricing</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </motion.div>

        <motion.div
          className="landing-hero__apps"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.22, ease: motionEase }}
        >
          <p className="landing-hero__apps-label">Apps in use</p>
          <ul className="landing-hero__app-grid">
            {HERO_APPS.map((app) => (
              <li key={app.key}>
                <a
                  href={app.href}
                  className="landing-hero__app-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="landing-hero__app-name">
                    {app.name}
                    <ArrowUpRight size={14} aria-hidden style={{ marginLeft: 4, verticalAlign: 'middle' }} />
                  </span>
                  <span className="landing-hero__app-summary">{app.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
