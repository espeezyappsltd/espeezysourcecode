'use client'

import Link from 'next/link'
import { useKanbanWorkspaceLink } from '@/hooks/useKanbanWorkspaceLink'

export type GamesProfileStats = {
  gamesPlayed: number
  totalScore: number
  totalPrizeCents: number
}

export type GamesProfileData = {
  id: string
  full_name: string | null
  username: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  subscription_plan: string | null
  created_at: string
}

export default function GamesProfileClient({
  profile,
  stats,
}: {
  profile: GamesProfileData
  stats: GamesProfileStats
}) {
  const kanbanUrl = useKanbanWorkspaceLink()
  const displayName = profile.full_name ?? profile.username ?? 'Player'
  const handle = profile.username ? `@${profile.username}` : null

  return (
    <main
      className="page-shell page-shell--narrow page-shell--standalone"
      style={{ padding: '2rem 1rem', minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}
    >
      <div
        style={{
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto 1rem',
              display: 'block',
              border: '3px solid #6366f1',
            }}
          />
        ) : (
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem',
              border: '3px solid #6366f1',
              fontWeight: 900,
              color: '#a5b4fc',
            }}
          >
            {displayName[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        <p
          style={{
            margin: '0 0 0.25rem',
            fontSize: '0.72rem',
            color: '#818cf8',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Espeezy Games
        </p>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 950, margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>
          {displayName}
        </h1>
        {handle && (
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 700 }}>{handle}</p>
        )}
        {profile.bio && (
          <p style={{ margin: '0 auto 1rem', maxWidth: 440, fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6 }}>
            {profile.bio}
          </p>
        )}

        <div
          style={{
            marginTop: '1rem',
            border: '1px solid rgba(99,102,241,0.25)',
            background: 'rgba(99,102,241,0.08)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'left',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
            Skirmish stats
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#e2e8f0' }}>
            Sessions completed: <strong>{stats.gamesPlayed}</strong>
            {' · '}
            Total score: <strong>{stats.totalScore}</strong>
            {' · '}
            Cash prizes: <strong>${(stats.totalPrizeCents / 100).toFixed(2)}</strong>
          </p>
          {profile.subscription_plan && profile.subscription_plan !== 'free' && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#a5b4fc' }}>
              Plan: <strong>{profile.subscription_plan}</strong>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <a
            href={kanbanUrl}
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              background: '#10b981',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Open Kanban workspace
          </a>
          <Link
            href="/categories"
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e2e8f0',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Browse games
          </Link>
        </div>

        <p style={{ margin: '1.5rem 0 0', fontSize: '0.72rem', color: 'rgba(148,163,184,0.6)' }}>
          Member since{' '}
          {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      </div>
    </main>
  )
}
