'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNotifications } from '@/components/NotificationProvider'
import { Listing, MarketplaceCategory } from '@/types/marketplace'
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/listing-validation'

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
  const { addToast } = useNotifications()

  const fetchListings = useCallback(
    async (opts?: { cursor?: string | null; append?: boolean; q?: string; category?: string }) => {
      const isMore = Boolean(opts?.append && opts?.cursor)
      if (isMore) setLoadingMore(true)
      else setLoading(true)

      try {
        const q = opts?.q ?? searchQuery
        const category = opts?.category ?? activeCategory
        const params = new URLSearchParams()
        if (q.trim()) params.set('q', q.trim())
        if (category && category !== 'All') params.set('category', category)
        params.set('status', 'AVAILABLE')
        params.set('limit', '24')
        if (opts?.cursor) params.set('cursor', opts.cursor)

        const res = await fetch(`/api/marketplace/listings?${params.toString()}`, {
          credentials: 'include',
        })
        const data = (await res.json()) as {
          listings?: Listing[]
          nextCursor?: string | null
          error?: string
        }

        if (!res.ok) {
          addToast('Marketplace', data.error ?? 'Could not load listings.', 'error')
          if (!isMore) setListings([])
          return
        }

        const incoming = data.listings ?? []
        setListings((prev) => (isMore ? [...prev, ...incoming] : incoming))
        setNextCursor(data.nextCursor ?? null)
        setHasMore(Boolean(data.nextCursor))

        if (!isMore) {
          try {
            localStorage.setItem('gf_marketplace_cache', JSON.stringify(incoming.slice(0, 24)))
          } catch {
            /* ignore quota */
          }
        }
      } catch {
        addToast('Marketplace', 'Network error loading listings.', 'error')
        if (!isMore) setListings([])
      } finally {
        setLoading(false)
        setLoadingMore(false)
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

    const cached = localStorage.getItem('gf_marketplace_cache')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Listing[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setListings(parsed)
          setLoading(false)
        }
      } catch {
        /* corrupted cache */
      }
    }
  }, [])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      void fetchListings({ q: searchQuery, category: activeCategory })
    }, 300)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery, activeCategory, fetchListings])

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return
    void fetchListings({ cursor: nextCursor, append: true, q: searchQuery, category: activeCategory })
  }, [nextCursor, loadingMore, fetchListings, searchQuery, activeCategory])

  const filteredListings = useMemo(() => listings, [listings])

  const categories = useMemo(
    () => ['All', ...MARKETPLACE_CATEGORIES] as MarketplaceCategory[],
    [],
  )

  return {
    listings,
    filteredListings,
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
