'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { HERO_COPY_LINES } from '@shared/platform-brand'
import './landing.css'

type Props = {
  userCount: number
}

export default function PlatformHero({ userCount }: Props) {
  return (
    <section id="hero" className="landing-section" style={{ textAlign: 'center', paddingTop: 'clamp(3rem, 8vw, 5rem)', paddingBottom: '1rem' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="landing-eyebrow">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)' }} />
          Learning apps
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{ maxWidth: 640, margin: '0 auto 1.5rem' }}
      >
        <h1 className="landing-title" style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)' }}>
          {HERO_COPY_LINES[0]}
        </h1>
        <p className="landing-lead">{HERO_COPY_LINES[1]}</p>
        {userCount > 0 ? (
          <p style={{ margin: '0.75rem auto 0', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ color: 'var(--brand)', fontWeight: 700 }}>{userCount.toLocaleString()}</span>{' '}
            {userCount === 1 ? 'user' : 'users'} on Espeezy
          </p>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="landing-hero-actions"
      >
        <a href="/login" className="platform-app-card__btn platform-app-card__btn--primary">
          Log in
          <ArrowRight size={16} aria-hidden />
        </a>
        <Link href="/login?mode=signup" className="platform-app-card__btn platform-app-card__btn--ghost">
          Sign up
        </Link>
      </motion.div>

      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        aria-label="Quick links"
        className="landing-hero-quicklinks"
      >
        <a href="#apps">Apps</a>
        <Link href="/docs">Docs</Link>
        <Link href="/checkout">Pricing</Link>
        <Link href="/contact">Contact</Link>
      </motion.nav>
    </section>
  )
}
