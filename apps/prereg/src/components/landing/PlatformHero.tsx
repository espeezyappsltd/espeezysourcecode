'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import {
  HERO_COPY_LINES,
  PLATFORM_OPERATIONS_TAGLINE,
} from '@shared/platform-brand'
import { PLATFORM_HERO_INTRO } from '@shared/platform-apps'
import './landing.css'

type Props = {
  userCount: number
}

export default function PlatformHero({ userCount }: Props) {
  return (
    <section id="hero" className="landing-section" style={{ textAlign: 'center', paddingTop: 'clamp(4rem, 10vw, 7rem)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="landing-eyebrow">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)' }} />
          Informational overview
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
          href="/login"
          className="platform-app-card__btn platform-app-card__btn--primary"
          style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem' }}
        >
          Log in
          <ArrowRight size={16} aria-hidden />
        </a>
        <Link href="/login?mode=signup" className="platform-app-card__btn platform-app-card__btn--ghost" style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem' }}>
          Sign up
        </Link>
      </motion.div>
    </section>
  )
}
