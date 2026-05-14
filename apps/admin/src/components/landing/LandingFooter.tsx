'use client'

import Link from 'next/link'
import Image from 'next/image'

// ─── Site map data ────────────────────────────────────────────────────────────
// 30+ surfaces across the platform  -  listed quietly for those who notice
const SITEMAP = [
  {
    label: 'Platform',
    pages: [
      { href: '/', label: 'Home' },
      { href: '/preregister', label: 'Early Access' },
      { href: '/login', label: 'Sign In' },
      { href: '/demo', label: 'Live Demo' },
      { href: '/contact', label: 'Contact' },
      { href: '/feed', label: 'Feed' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
  {
    label: 'Product',
    pages: [
      { href: '/product/intelligence', label: 'Intelligence' },
      { href: '/product/roadmap', label: 'Roadmap' },
      { href: '/product/sync', label: 'Sync' },
      { href: '/docs', label: 'Docs' },
      { href: '/docs/getting-started', label: 'Quick Start' },
      { href: '/docs/features', label: 'Features' },
      { href: '/games', label: 'Games' },
      { href: '/games.categories', label: 'Game Library' },
    ],
  },
  {
    label: 'Solutions',
    pages: [
      { href: '/solutions/teams', label: 'Teams' },
      { href: '/solutions/scholars', label: 'Scholars' },
      { href: '/solutions/enterprise', label: 'Enterprise' },
      { href: '/checkout', label: 'Pricing' },
      { href: '/fund', label: 'Mission Fund' },
      { href: '/donation/success', label: 'Donor Wall' },
    ],
  },
  {
    label: 'Workspace',
    pages: [
      { href: '/dashboard', label: 'Overview' },
      { href: '/dashboard/analytics', label: 'Analytics' },
      { href: '/dashboard/network', label: 'Network' },
      { href: '/dashboard/notifications', label: 'Notifications' },
      { href: '/dashboard/marketplace', label: 'Marketplace' },
      { href: '/dashboard/hustle', label: 'Hustle' },
      { href: '/dashboard/invoice', label: 'Invoices' },
      { href: '/dashboard/upgrade', label: 'Plans' },
    ],
  },
  {
    label: 'Account',
    pages: [
      { href: '/dashboard/profile', label: 'Profile' },
      { href: '/dashboard/settings', label: 'Settings' },
      { href: '/dashboard/music', label: 'Jukebox' },
      { href: '/dashboard/chillout', label: 'Break Room' },
      { href: '/dashboard/join', label: 'Join Team' },
      { href: '/auth/reset-password', label: 'Reset Password' },
    ],
  },
]

export default function LandingFooter() {
  return (
    <footer style={{ padding: '6rem 2rem 4rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', position: 'relative', zIndex: 10 }}>

      {/* ── Brand block ───────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.5rem', fontWeight: 700, justifyContent: 'center', marginBottom: '2rem', color: '#f3f4f6' }}>
          <Image src="/brand_logo2.svg" width={38} height={38} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain' }} alt="Espeezy" /> Espeezy
        </div>
        <p style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>Built by Sospeter • Project Lead</p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
          Unified collaboration architecture for global academic initiatives. Designed for researchers, scholars, and institutional teams.
        </p>
      </div>

      {/* ── Discreet sitemap  -  30+ pages quietly listed ───────────────────── */}
      <div style={{ maxWidth: '900px', margin: '0 auto 4rem', opacity: 0.18, pointerEvents: 'auto' }}
           title="30+ pages · blink and you'll miss it">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.2em', color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap', padding: '0 0.75rem' }}>
            30+ surfaces · 1 platform
          </span>
          <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.25rem 1.5rem' }}>
          {SITEMAP.map(col => (
            <div key={col.label}>
              <div style={{ fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.15em', color: '#4b5563', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {col.label}
              </div>
              {col.pages.map(p => (
                <Link
                  key={p.href}
                  href={p.href}
                  style={{
                    display: 'block',
                    fontSize: '0.6rem',
                    color: '#6b7280',
                    textDecoration: 'none',
                    lineHeight: '1.8',
                    fontWeight: 500,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', opacity: 0.6 }}>
        <Link href="/login" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>Sign in</Link>
        <Link href="/privacy" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>Global Terms</Link>
        <Link href="/fund" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>Support</Link>
      </div>
      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.7rem', color: '#374151', fontWeight: 500 }}>
        © {new Date().getFullYear()} Espeezy. All rights reserved.
      </p>
    </footer>
  )
}
