'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ExternalLink, Play } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { Game } from '@/types/games'
import { useCategoriesContext } from '@/context/CategoriesContext'

export default function GameDetailView({ gameId }: { gameId: string }) {
  const { categories } = useCategoriesContext()
  const cachedGame = useMemo(() => {
    for (const cat of categories) {
      const hit = cat.games?.find((g) => g.id === gameId)
      if (hit) return hit
    }
    return null
  }, [categories, gameId])

  const [game, setGame] = useState<Game | null>(cachedGame)
  const [loading, setLoading] = useState(!cachedGame)
  const [error, setError] = useState<string | null>(null)

  const category = categories.find((c) => c.games?.some((g) => g.id === gameId))

  useEffect(() => {
    setError(null)
    if (cachedGame) {
      setGame(cachedGame)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }, [gameId, cachedGame])

  useEffect(() => {
    let cancelled = false

    async function fetchGame() {
      const supabase = getSupabaseClient()
      if (!supabase) {
        if (!cancelled) {
          setError('Authentication is not configured.')
          setLoading(false)
        }
        return
      }
      const { data, error: err } = await supabase
        .from('games')
        .select('id, name, url, description, image_url, author, created_at, clicked_count, category_id')
        .eq('id', gameId)
        .single()
      if (cancelled) return
      if (err) setError(err.message)
      else setGame(data)
      setLoading(false)
    }

    void fetchGame()
    return () => {
      cancelled = true
    }
  }, [gameId])

  const handlePlayGame = async () => {
    if (!game) return
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.rpc('increment_game_click', { game_id: game.id })
      const { data } = await supabase.from('games').select('clicked_count').eq('id', game.id).single()
      if (data) setGame({ ...game, clicked_count: data.clicked_count })
    }
    window.open(game.url, '_blank', 'noopener')
  }

  if (loading && !game) return <p className="games-state">Loading game…</p>
  if (error) return <p className="games-state games-state--error">{error}</p>
  if (!game) return <p className="games-state">Game not found.</p>

  const backHref = category ? `/categories/${category.id}` : '/'

  return (
    <article className="game-detail">
      <Link href={backHref} className="game-detail__back">
        <ArrowLeft size={16} />
        Back to {category?.name ?? 'browse'}
      </Link>
      <div className="game-detail__panel">
        {game.image_url && (
          <Image
            src={game.image_url}
            alt={game.name}
            width={720}
            height={405}
            className="game-detail__img"
            priority
            unoptimized
          />
        )}
        <div className="game-detail__body">
          {category && (
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--games-brand)' }}>
              {category.name}
            </p>
          )}
          <h1 className="game-detail__title">{game.name}</h1>
          <p className="game-detail__desc">{game.description || 'No description provided.'}</p>
          <div className="game-detail__meta">
            <span>
              <strong>Author:</strong> {game.author || 'Unknown'}
            </span>
            <span>
              <strong>Plays:</strong> {game.clicked_count ?? 0}
            </span>
            {game.created_at && (
              <span>
                <strong>Added:</strong> {new Date(game.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <button type="button" className="game-detail__play" onClick={() => void handlePlayGame()}>
            <Play size={18} fill="currentColor" />
            Play now
            <ExternalLink size={14} style={{ opacity: 0.85 }} />
          </button>
        </div>
      </div>
    </article>
  )
}
