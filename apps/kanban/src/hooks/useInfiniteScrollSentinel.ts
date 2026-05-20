'use client'

import { useEffect, useRef } from 'react'

type Options = {
  enabled?: boolean
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  rootMargin?: string
}

/** Auto-fetch next page when sentinel enters the viewport (feed-style). */
export function useInfiniteScrollSentinel({
  enabled = true,
  hasMore,
  loading,
  onLoadMore,
  rootMargin = '280px',
}: Options) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!enabled || !el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, hasMore, loading, onLoadMore, rootMargin])

  return sentinelRef
}
