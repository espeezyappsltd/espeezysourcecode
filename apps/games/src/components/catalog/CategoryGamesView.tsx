'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCategoriesContext } from '@/context/CategoriesContext'
import { useGamesByCategoryPaginated } from '@/hooks/useGamesByCategoryPaginated'
import type { Game } from '@/types/games'

export default function CategoryGamesView({ categoryId }: { categoryId: string }) {
  const { categories } = useCategoriesContext()
  const category = categories.find((c) => c.id === categoryId)
  const { games, count, loading, error } = useGamesByCategoryPaginated(categoryId, 1, 100)

  if (loading) {
    return (
      <div className="game-card-grid" aria-busy="true">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skeleton-card" style={{ height: 220 }} />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="games-state games-state--error">{error}</p>
  }

  const title = category?.name ?? 'Category'

  return (
    <>
      <div className="games-page-hero">
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--games-brand)' }}>
          Category
        </p>
        <h1>{title}</h1>
        <p>
          {count ?? games.length} game{(count ?? games.length) === 1 ? '' : 's'} ready to play. Pick a title below or
          use the sidebar to jump between lanes.
        </p>
      </div>

      {games.length === 0 ? (
        <p className="games-state">No games in this category yet.</p>
      ) : (
        <div className="game-card-grid">
          {games.map((game: Game) => (
            <Link key={game.id} href={`/games/${game.id}`} className="game-card">
              {game.image_url ? (
                <Image src={game.image_url} alt="" width={400} height={225} className="game-card__img" unoptimized />
              ) : (
                <div className="game-card__img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--games-muted)', fontWeight: 800 }}>
                  {game.name[0]}
                </div>
              )}
              <div className="game-card__body">
                <h2 className="game-card__title">{game.name}</h2>
                <p className="game-card__play-hint">View & play →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
