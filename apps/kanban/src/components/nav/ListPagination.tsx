'use client'

import { Loader2 } from 'lucide-react'

type Props = {
  loadedCount: number
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  itemLabel?: string
}

export function ListPagination({
  loadedCount,
  hasMore,
  loadingMore,
  onLoadMore,
  itemLabel = 'items',
}: Props) {
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
    </footer>
  )
}
