'use client'

import { Loader2 } from 'lucide-react'
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel'

type Props = {
  loadedCount: number
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  itemLabel?: string
  autoLoad?: boolean
}

export function ListPagination({
  loadedCount,
  hasMore,
  loadingMore,
  onLoadMore,
  itemLabel = 'items',
  autoLoad = true,
}: Props) {
  const sentinelRef = useInfiniteScrollSentinel({
    enabled: autoLoad,
    hasMore,
    loading: loadingMore,
    onLoadMore,
  })

  if (loadedCount === 0) return null

  return (
    <footer className="list-pagination" aria-live="polite">
      <span className="list-pagination__count">
        Showing {loadedCount} {loadedCount === 1 ? itemLabel.replace(/s$/, '') : itemLabel}
        {hasMore ? '+' : ''}
      </span>
      {hasMore ? (
        <button
          type="button"
          className="btn btn-secondary list-pagination__more"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
          Load more
        </button>
      ) : null}
      {autoLoad && hasMore ? <div ref={sentinelRef} className="list-scroll-sentinel" aria-hidden /> : null}
    </footer>
  )
}
