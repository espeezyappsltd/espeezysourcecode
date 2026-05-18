'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { HustleCategory } from '@/lib/hustle/task-validation'

export type HustleTab = 'marketplace' | 'mine' | 'sales' | 'inventory'

export type HustleItem = {
  id: string
  poster_id: string
  title: string
  description?: string
  category: string
  payout_cents?: number
  price?: number
  status?: string
  created_at: string
  poster?: {
    id?: string
    full_name: string
    avatar_url?: string | null
    username?: string | null
  } | null
}

const CACHE_PREFIX = 'gf_hustle_cache_v1'
const DEBOUNCE_MS = 280

function cacheKey(tab: HustleTab, q: string, cat: string) {
  return `${CACHE_PREFIX}:${tab}:${cat}:${q.trim().toLowerCase()}`
}

function readCache(key: string): HustleItem[] | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { items?: HustleItem[]; at?: number }
    if (!Array.isArray(parsed.items)) return null
    if (parsed.at && Date.now() - parsed.at > 5 * 60_000) return null
    return parsed.items
  } catch {
    return null
  }
}

function writeCache(key: string, items: HustleItem[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ items: items.slice(0, 40), at: Date.now() }))
  } catch {
    /* quota */
  }
}

export function useHustle() {
  const [tab, setTab] = useState<HustleTab>('marketplace')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | HustleCategory>('all')
  const [items, setItems] = useState<HustleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchItems = useCallback(
    async (opts?: { cursor?: string | null; tab?: HustleTab; q?: string; cat?: typeof category }) => {
      const currentTab = opts?.tab ?? tab
      const query = opts?.q ?? search
      const cat = opts?.cat ?? category
      const cursor = opts?.cursor ?? null
      const isMore = Boolean(cursor)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const key = cacheKey(currentTab, query, cat)
      if (!isMore) {
        const cached = readCache(key)
        if (cached?.length) {
          setItems(cached)
          setLoading(false)
        } else {
          setLoading(true)
        }
      } else {
        setLoadingMore(true)
      }

      try {
        const params = new URLSearchParams()
        if (query.trim()) params.set('q', query.trim())
        if (cat !== 'all') params.set('category', cat)
        if (cursor) params.set('cursor', cursor)

        let endpoint = ''
        switch (currentTab) {
          case 'marketplace':
            endpoint = `/api/hustle/tasks?status=open&${params}`
            break
          case 'mine':
            endpoint = `/api/hustle/tasks?mine=1&${params}`
            break
          case 'sales':
            endpoint = `/api/marketplace/listings?mine=1&${params}`
            break
          case 'inventory':
            endpoint = `/api/assets?${params}`
            break
        }

        const res = await fetch(endpoint, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!res.ok) return

        const data = await res.json()
        const newItems: HustleItem[] =
          data.tasks ??
          data.listings?.map(
            (l: {
              id: string
              title: string
              category: string
              price?: number
              created_at: string
              owner_id: string
              profiles?: HustleItem['poster']
            }) => ({
              id: l.id,
              poster_id: l.owner_id,
              title: l.title,
              category: l.category,
              price: l.price,
              created_at: l.created_at,
              poster: l.profiles ? { ...l.profiles, id: l.owner_id } : null,
            }),
          ) ??
          data.assets ??
          []

        setItems((prev) => (isMore ? [...prev, ...newItems] : newItems))
        setNextCursor(data.nextCursor ?? null)

        if (!isMore) writeCache(key, newItems)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Hustle fetch error:', err instanceof Error ? err.message : 'unknown')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [tab, search, category],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchItems({ tab, q: search, cat: category })
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [tab, search, category, fetchItems])

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return
    void fetchItems({ cursor: nextCursor, tab, q: search, cat: category })
  }, [nextCursor, loadingMore, fetchItems, tab, search, category])

  const refresh = useCallback(() => {
    void fetchItems({ tab, q: search, cat: category })
  }, [fetchItems, tab, search, category])

  return {
    tab,
    setTab,
    search,
    setSearch,
    category,
    setCategory,
    items,
    loading,
    loadingMore,
    nextCursor,
    loadMore,
    refresh,
  }
}
