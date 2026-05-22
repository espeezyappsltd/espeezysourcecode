'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import { useCategoriesContext } from '@/context/CategoriesContext'
import { AddGameToCategoryForm } from '@/components/catalog/AddGameToCategoryForm'
import type { Game } from '@/types/games'

export default function CategoryGamesView({ categoryId }: { categoryId: string }) {
  const { categories, loading, error, refresh } = useCategoriesContext()

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  )

  const games: Game[] = category?.games ?? []

  const handleGameAdded = () => {
    refresh()
  }

  if (loading && !category) {
    return (
      <div className="game-card-grid game-card-grid--loading" aria-busy="true">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="skeleton-card skeleton-card--game" />
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
      <div className="games-page-hero games-page-hero--compact">
        <p className="games-page-hero__eyebrow">Category</p>
        <h1>{title}</h1>
        <p>
          {games.length} game{games.length === 1 ? '' : 's'} ready to play. Pick a title below or use the sidebar to
          jump between lanes.
        </p>
      </div>

      <AddGameToCategoryForm categoryId={categoryId} categoryName={title} onAdded={handleGameAdded} />

      {games.length === 0 ? (
        <p className="games-state">No games in this category yet.</p>
      ) : (
        <div className="game-card-grid" role="list" aria-label={`${title} games`}>
          {games.map((game: Game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="game-card"
              role="listitem"
            >
              {game.image_url ? (
                <Image
                  src={game.image_url}
                  alt=""
                  width={400}
                  height={225}
                  className="game-card__img"
                  unoptimized
                  sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, 240px"
                />
              ) : (
                <div
                  className="game-card__img game-card__img--placeholder"
                  aria-hidden
                >
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
