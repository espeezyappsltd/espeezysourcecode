'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { fetchGameCategories, type GameCategory } from '@/services/games'

const tierColor: Record<string, string> = {
  easy: '#10B981',
  medium: '#0EA5E9',
  hard: '#F59E0B',
  expert: '#F97316',
  legendary: '#EF4444',
}

export default function GamesLobbyClient() {
  const [categories, setCategories] = useState<GameCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true
    fetchGameCategories()
      .then((data) => {
        if (mounted) setCategories(data)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    )
  }, [categories, search])

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '2.5rem 1rem 4rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: 0, color: 'var(--brand)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.75rem' }}>Standalone Games</p>
        <h1 style={{ margin: '0.4rem 0 0.75rem', fontSize: 'clamp(1.8rem,4vw,2.6rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>Play Quiz Games With Guest Or Member Mode</h1>
        <p style={{ margin: 0, color: 'var(--text-sub)', maxWidth: 720 }}>
          Start instantly as a guest, or sign in to link scores and rewards to your profile.
        </p>
      </header>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor='game-search' style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', color: 'var(--text-sub)', fontWeight: 700 }}>Search Categories</label>
        <input
          id='game-search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Try: coding, math, history...'
          style={{ width: '100%', background: 'var(--bg-sub)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.8rem 0.9rem' }}
        />
      </div>

      {loading ? <p style={{ color: 'var(--text-sub)' }}>Loading games...</p> : null}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.9rem' }}>
        {filtered.map((c) => (
          <article key={c.id} style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 14, padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{c.name}</h2>
              <span style={{ background: `${tierColor[c.difficulty_tier] ?? '#10B981'}1F`, color: tierColor[c.difficulty_tier] ?? '#10B981', border: `1px solid ${tierColor[c.difficulty_tier] ?? '#10B981'}66`, borderRadius: 100, fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.55rem' }}>
                {c.difficulty_tier}
              </span>
            </div>
            <p style={{ margin: '0.6rem 0', color: 'var(--text-sub)', fontSize: '0.86rem', minHeight: 40 }}>{c.description ?? 'No description yet.'}</p>
            <p style={{ margin: '0 0 0.8rem', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
              Prize Pool: ${(c.prize_pool_cents / 100).toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link href={`/games/${c.slug}`} style={{ textDecoration: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 8, padding: '0.55rem 0.8rem', fontWeight: 800, fontSize: '0.78rem' }}>
                Play Category
              </Link>
              <Link href={`/games/${c.slug}?mode=guest`} style={{ textDecoration: 'none', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 8, padding: '0.55rem 0.8rem', fontWeight: 700, fontSize: '0.78rem' }}>
                Guest Quick Play
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
