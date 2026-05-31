'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number
  totalPages: number
  from: number
  to: number
  total: number
  buildHref: (page: number) => string
  itemLabel?: string
}

export function OffsetPageNav({
  page,
  totalPages,
  from,
  to,
  total,
  buildHref,
  itemLabel = 'results',
}: Props) {
  if (total === 0) return null

  const prev = page > 1 ? page - 1 : null
  const next = page < totalPages ? page + 1 : null

  const windowStart = Math.max(1, page - 2)
  const windowEnd = Math.min(totalPages, page + 2)
  const pages: number[] = []
  for (let p = windowStart; p <= windowEnd; p += 1) pages.push(p)

  return (
    <nav className="offset-page-nav" aria-label="Pagination">
      <p className="offset-page-nav__meta">
        {from}–{to} of {total} {total === 1 ? itemLabel.replace(/s$/, '') : itemLabel}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
      </p>
      {totalPages > 1 ? (
        <div className="offset-page-nav__controls">
          {prev ? (
            <Link href={buildHref(prev)} className="offset-page-nav__btn" aria-label="Previous page">
              <ChevronLeft size={18} aria-hidden />
            </Link>
          ) : (
            <span className="offset-page-nav__btn offset-page-nav__btn--disabled" aria-hidden>
              <ChevronLeft size={18} />
            </span>
          )}
          <div className="offset-page-nav__pages">
            {pages.map((p) => (
              <Link
                key={p}
                href={buildHref(p)}
                className={`offset-page-nav__page${p === page ? ' offset-page-nav__page--active' : ''}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Link>
            ))}
          </div>
          {next ? (
            <Link href={buildHref(next)} className="offset-page-nav__btn" aria-label="Next page">
              <ChevronRight size={18} aria-hidden />
            </Link>
          ) : (
            <span className="offset-page-nav__btn offset-page-nav__btn--disabled" aria-hidden>
              <ChevronRight size={18} />
            </span>
          )}
        </div>
      ) : null}
    </nav>
  )
}
