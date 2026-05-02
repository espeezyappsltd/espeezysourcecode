'use client'

import React from 'react'
import { MarketplaceCategory } from '@/types/marketplace'

interface MarketplaceSidebarProps {
  categories: string[]
  activeCategory: string
  setActiveCategory: (cat: MarketplaceCategory) => void
}

export function MarketplaceSidebar({ categories, activeCategory, setActiveCategory }: MarketplaceSidebarProps) {
  return (
    <aside style={{ width: '220px', flexShrink: 0, position: 'sticky', top: '1rem' }} className="hide-mobile">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 950, textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.1em', marginBottom: '1rem' }}>Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat as MarketplaceCategory)}
                style={{ 
                  textAlign: 'left', 
                  padding: '0.6rem 1rem', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: activeCategory === cat ? 'var(--brand)' : 'transparent',
                  color: activeCategory === cat ? 'black' : 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: activeCategory === cat ? 900 : 600,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ padding: '1.25rem', background: 'rgba(var(--brand-rgb), 0.05)', borderRadius: '16px', border: '1px solid rgba(var(--brand-rgb), 0.1)' }}>
          <div style={{ fontWeight: 950, fontSize: '0.75rem', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Global Sync</div>
          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>Results are live from the campus-wide peer registry.</p>
        </div>
      </div>
    </aside>
  )
}
