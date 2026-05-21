'use client'

import Link from 'next/link'
import type { Category } from '@/types/games'

const GLOWS = ['#818cf8', '#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#fb923c']

type CategoryGridProps = {
  categories: Category[]
  loading?: boolean
  error?: string | null
}

export default function CategoryGrid({ categories, loading, error }: CategoryGridProps) {
  if (loading) {
    return (
      <div className="category-grid" aria-busy="true">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="skeleton-card" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="games-state games-state--error">{error}</p>
  }

  if (!categories.length) {
    return (
      <p className="games-state">
        No categories yet. Check back soon — new skirmish lanes are added regularly.
      </p>
    )
  }

  return (
    <div className="category-grid">
      {categories.map((cat, index) => {
        const glow = GLOWS[index % GLOWS.length]
        const games = cat.games ?? []
        return (
          <Link key={cat.id} href={`/categories/${cat.id}`} className="category-card">
            <div className="category-card__glow" style={{ background: glow }} aria-hidden />
            <h3 className="category-card__title">{cat.name}</h3>
            <p className="category-card__meta">
              {games.length} game{games.length === 1 ? '' : 's'} in this lane
            </p>
            {games.length > 0 && (
              <div className="category-card__samples">
                {games.slice(0, 3).map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="category-card__sample"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {game.name}
                  </Link>
                ))}
                {games.length > 3 && (
                  <span className="category-card__sample" style={{ opacity: 0.7 }}>
                    +{games.length - 3} more
                  </span>
                )}
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
