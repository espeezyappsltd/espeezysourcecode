'use client'

import Link from 'next/link'
import { BarChart3, Gamepad2, Lock, Sparkles, Zap } from 'lucide-react'
import type { Feature } from '@/utils/feature-gate'
import { PLATFORM_OPERATIONS_TAGLINE } from '@/lib/platform/brand-copy'
import { marketingPricingUrl } from '@/lib/marketing-urls'

const FEATURE_META: Record<
  Feature,
  { title: string; description: string; icon: typeof BarChart3; planLabel: string }
> = {
  BREAK_ROOM: {
    title: 'Break Room',
    description: 'Host live team games, skirmishes, and study breaks with your group.',
    icon: Gamepad2,
    planLabel: 'Pro Scholar',
  },
  PROJECT_STATS: {
    title: 'Project Stats',
    description: 'Live analytics, team leaderboards, evidence density, and exportable intelligence reports.',
    icon: BarChart3,
    planLabel: 'Pro Scholar',
  },
  JUKEBOX: {
    title: 'Jukebox',
    description: 'Shared playlists and music for your team workspace.',
    icon: Sparkles,
    planLabel: 'Pro Scholar',
  },
  ADVANCED_THEMES: {
    title: 'Advanced Themes',
    description: 'Unlock premium palettes and workspace styling.',
    icon: Sparkles,
    planLabel: 'Pro Scholar',
  },
  UNLIMITED_GROUPS: {
    title: 'Unlimited Groups',
    description: 'Join and manage more than one project team.',
    icon: Zap,
    planLabel: 'Pro Scholar',
  },
  ADMIN_ANALYTICS: {
    title: 'Admin Analytics',
    description: 'Institutional dashboards and oversight tools.',
    icon: BarChart3,
    planLabel: 'Premium Scholar',
  },
  PRIORITY_AI: {
    title: 'Priority AI',
    description: 'Faster AI assists for task and project workflows.',
    icon: Zap,
    planLabel: 'Pro Scholar',
  },
  HISTORICAL_ARCHIVING: {
    title: 'Historical Archiving',
    description: 'Long-term retention for completed project work.',
    icon: BarChart3,
    planLabel: 'Pro Scholar',
  },
  SSL_SHIELDED_ROOMS: {
    title: 'SSL Shielded Rooms',
    description: 'Encrypted collaboration rooms for sensitive work.',
    icon: Lock,
    planLabel: 'Pro Scholar',
  },
  EARLY_ACCESS_LAB: {
    title: 'Early Access Lab',
    description: 'Try experimental features before general release.',
    icon: Sparkles,
    planLabel: 'Premium Scholar',
  },
  RESEARCHER_API: {
    title: 'Researcher API',
    description: 'Programmatic access for research integrations.',
    icon: Zap,
    planLabel: 'Premium Scholar',
  },
}

export default function PremiumFeatureGate({ feature }: { feature: Feature }) {
  const meta = FEATURE_META[feature]
  const Icon = meta.icon

  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '4rem auto',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        background: 'var(--surface)',
        borderRadius: '28px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 1.5rem',
          borderRadius: '20px',
          background: 'rgba(var(--brand-rgb), 0.12)',
          color: 'var(--brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={36} aria-hidden />
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.65rem',
          fontWeight: 900,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--brand)',
          marginBottom: '0.75rem',
        }}
      >
        <Lock size={12} aria-hidden /> Premium feature
      </div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 950, margin: '0 0 0.75rem', letterSpacing: '-0.03em' }}>
        {meta.title}
      </h1>
      <p style={{ color: 'var(--text-sub)', fontSize: '1rem', lineHeight: 1.55, margin: '0 0 2rem' }}>
        {meta.description} Available on <strong>{meta.planLabel}</strong> and above.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
        <a
          href={marketingPricingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ padding: '0.9rem 2rem', width: 'auto', fontSize: '1rem', fontWeight: 900, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          <Sparkles size={18} style={{ marginRight: '0.5rem' }} />
          View plans on espeezy.com
        </a>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-sub)', lineHeight: 1.5, margin: 0, maxWidth: '360px' }}>
          {PLATFORM_OPERATIONS_TAGLINE}
        </p>
        <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 700, textDecoration: 'none' }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
