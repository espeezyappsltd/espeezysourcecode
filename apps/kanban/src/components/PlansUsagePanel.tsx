'use client'

import { useEffect, useState } from 'react'
import { Activity, HardDrive, Layers, ListTodo, Sparkles } from 'lucide-react'
import { friendlySupabaseError } from '@/utils/supabase-errors'

type UsageStats = {
  tier: string
  subscriptionStatus: string
  storageUsedBytes: number
  storageQuotaBytes: number
  storagePercent: number
  groupTasks: number
  myOpenTasks: number
  personalAssets: number
  contributionScore: number
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function tierLabel(tier: string) {
  const t = tier.toLowerCase()
  if (t === 'premium' || t === 'lifetime') return 'Premium'
  if (t === 'pro') return 'Pro'
  if (t === 'admin') return 'Admin'
  return 'Free'
}

export default function PlansUsagePanel() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/usage', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load usage')
        if (active) setStats(data)
      })
      .catch((err) => {
        if (active) {
          const raw = err instanceof Error ? err.message : 'Failed to load usage'
          setError(friendlySupabaseError(raw, 'Failed to load usage'))
        }
      })
    return () => {
      active = false
    }
  }, [])

  if (error) {
    return (
      <div
        role="alert"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(248, 113, 113, 0.35)',
          background: 'rgba(248, 113, 113, 0.08)',
        }}
      >
        <p style={{ color: '#fca5a5', fontSize: '0.9rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{error}</p>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', margin: 0 }}>
          If you are the site owner, confirm on Vercel:{' '}
          <code style={{ fontSize: '0.75rem' }}>NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
          <code style={{ fontSize: '0.75rem' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and that the kanban app is linked to the correct Supabase project.
        </p>
      </div>
    )
  }

  if (!stats) {
    return <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Loading usage…</p>
  }

  const items = [
    { icon: Sparkles, label: 'Plan', value: tierLabel(stats.tier), sub: stats.subscriptionStatus },
    { icon: HardDrive, label: 'Storage', value: `${formatBytes(stats.storageUsedBytes)} / ${formatBytes(stats.storageQuotaBytes)}`, sub: `${stats.storagePercent}% used` },
    { icon: ListTodo, label: 'Open tasks (you)', value: String(stats.myOpenTasks), sub: `${stats.groupTasks} team tasks` },
    { icon: Layers, label: 'Personal assets', value: String(stats.personalAssets), sub: 'files & links' },
    { icon: Activity, label: 'Contribution score', value: String(stats.contributionScore), sub: 'XP from completed work' },
  ]

  return (
    <section
      aria-label="Your plan and usage"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        background: 'rgba(16, 185, 129, 0.06)',
      }}
    >
      {items.map(({ icon: Icon, label, value, sub }) => (
        <article
          key={label}
          style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Icon size={18} color="#10b981" style={{ marginBottom: '0.5rem' }} aria-hidden />
          <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>
            {label}
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{value}</p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sub}</p>
        </article>
      ))}
    </section>
  )
}
