'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import {
  HERO_COPY_LINES,
  KANBAN_DEMO_LABEL,
  KANBAN_DEMO_PATH,
  PLATFORM_OPERATIONS_TAGLINE,
} from '@shared/platform-brand'
import { PLATFORM_APP_STATUS_LABEL, PLATFORM_HERO_INTRO, type PlatformApp } from '@shared/platform-apps'
import { PlatformAppIcon } from './platform-app-icon'
import './landing.css'

type Props = {
  apps: PlatformApp[]
  kanbanAppUrl: string
  kanbanDemoUrl: string
  userCount: number
}

export default function PlatformHero({ apps, kanbanAppUrl, kanbanDemoUrl, userCount }: Props) {
  const liveApps = apps.filter((a) => a.status === 'live' || a.status === 'beta')
  const devApps = apps.filter((a) => a.status === 'development' || a.status === 'coming_soon')

  return (
    <section id="hero" className="landing-section" style={{ textAlign: 'center', paddingTop: 'clamp(4rem, 10vw, 7rem)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="landing-eyebrow">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)' }} />
          Free tier for students
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{ maxWidth: 860, margin: '0 auto 1.25rem' }}
      >
        <h1 className="landing-title" style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)' }}>
          {HERO_COPY_LINES[0]}
        </h1>
        <p className="landing-lead">{HERO_COPY_LINES[1]}</p>
        <p className="landing-lead" style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>
          {PLATFORM_HERO_INTRO}
        </p>
        <p style={{ margin: '1rem auto 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
          {PLATFORM_OPERATIONS_TAGLINE}
          {userCount > 0 && (
            <>
              {' · '}
              <span style={{ color: 'var(--brand)' }}>{userCount.toLocaleString()}</span> students using Espeezy
            </>
          )}
        </p>
      </motion.div>

      <div className="hero-apps-strip">
        {liveApps.map((app) => (
          <Link key={app.slug} href={`/apps/${app.slug}`} className="hero-apps-pill">
            <PlatformAppIcon iconKey={app.icon_key} appSlug={app.slug} size={16} color={app.accent_color} />
            {app.name.replace(/^Espeezy\s+/i, '')}
            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800 }}>
              {PLATFORM_APP_STATUS_LABEL[app.status]}
            </span>
          </Link>
        ))}
        {devApps.map((app) => (
          <Link key={app.slug} href={`/apps/${app.slug}`} className="hero-apps-pill hero-apps-pill--dev">
            <PlatformAppIcon iconKey={app.icon_key} appSlug={app.slug} size={16} color={app.accent_color} />
            {app.name.replace(/^Espeezy\s+/i, '')}
            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>
              {PLATFORM_APP_STATUS_LABEL[app.status]}
            </span>
          </Link>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '2rem',
        }}
      >
        <a
          href={kanbanAppUrl}
          className="platform-app-card__btn platform-app-card__btn--primary"
          style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem' }}
        >
          Start free
          <ArrowRight size={16} aria-hidden />
        </a>
        <a
          href={kanbanDemoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="platform-app-card__btn platform-app-card__btn--ghost"
          style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem' }}
        >
          {KANBAN_DEMO_LABEL}
        </a>
        <a href="#apps" className="platform-app-card__btn platform-app-card__btn--ghost" style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem' }}>
          Browse all apps
        </a>
      </motion.div>
    </section>
  )
}
