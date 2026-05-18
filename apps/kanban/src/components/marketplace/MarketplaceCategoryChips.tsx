'use client'

import React, { memo } from 'react'
import type { MarketplaceCategory } from '@/types/marketplace'

type Props = {
  categories: string[]
  activeCategory: string
  onSelect: (cat: MarketplaceCategory | 'All') => void
}

export const MarketplaceCategoryChips = memo(function MarketplaceCategoryChips({
  categories,
  activeCategory,
  onSelect,
}: Props) {
  return (
    <div className="marketplace-mobile-cats hide-desktop" role="tablist" aria-label="Filter by category">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={activeCategory === cat}
          className={`marketplace-mobile-cats__chip${activeCategory === cat ? ' marketplace-mobile-cats__chip--active' : ''}`}
          onClick={() => onSelect(cat as MarketplaceCategory | 'All')}
        >
          {cat}
        </button>
      ))}
    </div>
  )
})
