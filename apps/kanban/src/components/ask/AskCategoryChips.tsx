'use client'

import Link from 'next/link'
import { ASK_CATEGORY_LABELS, ASK_CATEGORY_ORDER, type AskCategoryFilter } from '@/lib/ask/types'
import { askCategoryUrl, askListUrl } from '@/lib/nav/category-url'

type Props = {
  active: AskCategoryFilter
  searchQuery: string
}

export function AskCategoryChips({ active, searchQuery }: Props) {
  const ctx = { q: searchQuery || null }

  return (
    <div className="ask-chips" role="navigation" aria-label="Resource categories">
      <Link
        href={askListUrl({ q: ctx.q })}
        className={`ask-chips__chip${active === 'all' ? ' ask-chips__chip--active' : ''}`}
        aria-current={active === 'all' ? 'page' : undefined}
      >
        All
      </Link>
      {ASK_CATEGORY_ORDER.map((id) => (
        <Link
          key={id}
          href={askCategoryUrl(id, ctx)}
          className={`ask-chips__chip${active === id ? ' ask-chips__chip--active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
        >
          {ASK_CATEGORY_LABELS[id]}
        </Link>
      ))}
    </div>
  )
}
