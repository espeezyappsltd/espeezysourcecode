'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNotifications } from '@/components/NotificationProvider'
import { Listing, MarketplaceCategory } from '@/types/marketplace'
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/listing-validation'

const CACHE_PREFIX = 'gf_marketplace_cache_v2'
const DEBOUNCE_MS = 280
const PAGE_LIMIT = 32

function cacheKey(q: string, category: string) {
  return `${CACHE_PREFIX}:${category}:${q.trim().toLowerCase()}`
}

function readCache(key: string): Listing[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { listings?: Listing[]; at?: number }
    if (!Array.isArray(parsed.listings)) return null
    if (parsed.at && Date.now() - parsed.at > 10 * 60_000) return null
    return parsed.listings
  } catch {
    return null
  }
}

function writeCache(key: string, listings: Listing[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ listings: listings.slice(0, PAGE_LIMIT), at: Date.now() }))
  } catch {
    /* quota */
  }
}

export function useMarketplace() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory>('All')
  const [isPosting, setIsPosting] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { addToast } = useNotifications()

  const fetchListings = useCallback(
    async (opts?: { cursor?: string | null; append?: boolean; q?: string; category?: string }) => {
      const isMore = Boolean(opts?.append && opts?.cursor)
      const q = opts?.q ?? searchQuery
      const category = opts?.category ?? activeCategory
      const key = cacheKey(q, category)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      if (isMore) {
        setLoadingMore(true)
      } else {
        const cached = readCache(key)
        if (cached?.length) {
          setListings(cached)
          setLoading(false)
        } else {
          setLoading(true)
        }
      }

      try {
        const params = new URLSearchParams()
        if (q.trim()) params.set('q', q.trim())
        if (category && category !== 'All') params.set('category', category)
        params.set('status', 'AVAILABLE')
        params.set('limit', String(PAGE_LIMIT))
        if (opts?.cursor) params.set('cursor', opts.cursor)

        const res = await fetch(`/api/marketplace/listings?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        const data = (await res.json()) as {
          listings?: Listing[]
          nextCursor?: string | null
          error?: string
        }

        if (!res.ok) {
          addToast('Marketplace', data.error ?? 'Could not load listings.', 'error')
          if (!isMore && !readCache(key)) setListings([])
          return
        }

        const incoming = data.listings ?? []
        setListings((prev) => (isMore ? [...prev, ...incoming] : incoming))
        setNextCursor(data.nextCursor ?? null)
        setHasMore(Boolean(data.nextCursor))

        if (!isMore) writeCache(key, incoming)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        addToast('Marketplace', 'Network error loading listings.', 'error')
        if (!isMore && !readCache(key)) setListings([])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [activeCategory, searchQuery, addToast],
  )

  useEffect(() => {
    const hasSeen = localStorage.getItem('gf_marketplace_onboarding')
    if (!hasSeen) {
      setShowWalkthrough(true)
      localStorage.setItem('gf_marketplace_onboarding', 'true')
    }

    const cached = readCache(cacheKey('', 'All'))
    if (cached?.length) {
      setListings(cached)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      void fetchListings({ q: searchQuery, category: activeCategory })
    }, DEBOUNCE_MS)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery, activeCategory, fetchListings])

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return
    void fetchListings({ cursor: nextCursor, append: true, q: searchQuery, category: activeCategory })
  }, [nextCursor, loadingMore, fetchListings, searchQuery, activeCategory])

  const categories = ['All', ...MARKETPLACE_CATEGORIES] as MarketplaceCategory[]

  return {
    listings,
    filteredListings: listings,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    categories,
    isPosting,
    setIsPosting,
    showWalkthrough,
    setShowWalkthrough,
    selectedListing,
    setSelectedListing,
    fetchListings,
  }
}
