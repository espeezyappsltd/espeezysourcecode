'use client'

import Link from 'next/link'
import { Music, Lock, Loader2 } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { hasFeature } from '@/utils/feature-gate'

export default function JukeboxPage() {
  const { profile, loading } = useProfile()
  const unlocked = hasFeature(profile, 'JUKEBOX')

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--brand)' }} />
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div style={{ maxWidth: 520, margin: '3rem auto', padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)' }}>
        <Lock size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-sub)' }} />
        <h1 style={{ margin: '0 0 0.5rem', fontWeight: 950 }}>Espeezy Jukebox</h1>
        <p style={{ color: 'var(--text-sub)', fontWeight: 600, lineHeight: 1.5 }}>
          Share what you are listening to with your cohort. Jukebox is included on Pro and Premium plans.
        </p>
        <Link href="/upgrade" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '1.25rem', gap: 8 }}>
          Upgrade to Pro
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <h1 style={{ margin: 0, fontWeight: 950, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Music color="var(--brand)" /> Espeezy Jukebox
      </h1>
      <p style={{ color: 'var(--text-sub)', fontWeight: 600, marginTop: '0.5rem' }}>
        Campus listening lounge — connect your music and show now playing on your profile.
      </p>
      <div
        style={{
          marginTop: '2rem',
          padding: '2rem',
          borderRadius: 20,
          border: '1px dashed var(--border)',
          background: 'var(--bg-sub)',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Jukebox is unlocked on your plan.</p>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
          Spotify connection and shared playlists are coming next. Your presence card will show track info when connected.
        </p>
      </div>
    </div>
  )
}
