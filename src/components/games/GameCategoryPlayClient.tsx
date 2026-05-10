'use client'

import Link from 'next/link'

export default function GameCategoryPlayClient({ slug }: { slug: string }) {
  return (
    <section style={{ display: 'grid', gap: '1rem', padding: '1.25rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Game Category</h1>
      <p style={{ margin: 0, color: 'var(--text-sub)' }}>
        Category: <strong>{slug}</strong>
      </p>
      <p style={{ margin: 0, color: 'var(--text-sub)' }}>
        This route is intentionally minimal while the broader platform refactor is in progress.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/games" className="btn btn-primary">Back to Games</Link>
        <Link href="/dashboard" className="btn btn-secondary">Go to Dashboard</Link>
      </div>
    </section>
  )
}
