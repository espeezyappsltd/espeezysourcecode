'use client'

import CategoryGrid from '@/components/catalog/CategoryGrid'
import { useCategoriesContext } from '@/context/CategoriesContext'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import LiveChatWidget from '@/components/LiveChatWidget'

export default function GamesBrowseHomePage() {
  const { categories, loading, error } = useCategoriesContext()
  const user = useSupabaseUser()

  const totalGames = categories.reduce((acc, c) => acc + (c.games?.length ?? 0), 0)

  return (
    <>
      <div className="games-page-hero">
        <p
          style={{
            margin: '0 0 0.5rem',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--games-brand)',
          }}
        >
          Espeezy Games
        </p>
        <h1>Browse study categories</h1>
        <p>
          Select a category to explore curated games and study sessions. Use the sidebar to move between categories
          and individual titles.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginTop: '1.25rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--games-muted)',
          }}
        >
          <span>
            <strong style={{ color: 'var(--games-text)' }}>{categories.length}</strong> categories
          </span>
          <span>
            <strong style={{ color: 'var(--games-text)' }}>{totalGames}</strong> games
          </span>
        </div>
      </div>

      <section aria-labelledby="browse-categories-heading">
        <h2
          id="browse-categories-heading"
          style={{
            margin: '0 0 1.25rem',
            fontSize: '1.1rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          All categories
        </h2>
        <CategoryGrid categories={categories} loading={loading} error={error} />
      </section>

      {user && <LiveChatWidget appScope="games" user={user} />}
    </>
  )
}
