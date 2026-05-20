'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useMediaColumnCount } from '@/hooks/useMediaColumnCount'
import { VIRTUALIZE_THRESHOLD } from '@/lib/list/viewport-list'
import './list-virtual.css'

type Props<T> = {
  items: T[]
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  rowEstimateSize?: number
  gapPx?: number
  className?: string
  role?: string
  footer?: ReactNode
  columns?: { mobile: number; tablet: number; desktop: number }
}

export function VirtualizedGridList<T>({
  items,
  getKey,
  renderItem,
  rowEstimateSize = 248,
  gapPx = 9,
  className = '',
  role = 'list',
  footer,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
}: Props<T>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const columnCount = useMediaColumnCount(columns)
  const rowCount = Math.ceil(items.length / columnCount) || 0
  const useVirtual = items.length >= VIRTUALIZE_THRESHOLD

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => setScrollMargin(el.offsetTop)
    measure()
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
  }, [items.length, columnCount, useVirtual])

  const virtualizer = useWindowVirtualizer({
    count: useVirtual ? rowCount : 0,
    estimateSize: () => rowEstimateSize + gapPx,
    overscan: 3,
    scrollMargin,
  })

  if (!useVirtual) {
    return (
      <div
        ref={rootRef}
        className={className}
        role={role}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          gap: gapPx,
        }}
      >
        {items.map((item, index) => (
          <div key={getKey(item, index)}>{renderItem(item, index)}</div>
        ))}
        {footer ? <div style={{ gridColumn: '1 / -1' }}>{footer}</div> : null}
      </div>
    )
  }

  const totalHeight = virtualizer.getTotalSize() + (footer ? 72 : 0)

  return (
    <div
      ref={rootRef}
      className={`virtual-grid ${className}`.trim()}
      role={role}
      style={
        {
          height: totalHeight,
          position: 'relative',
          '--virtual-grid-gap': `${gapPx}px`,
        } as React.CSSProperties
      }
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const rowIndex = virtualRow.index
        const startIndex = rowIndex * columnCount
        return (
          <div
            key={`row-${rowIndex}`}
            className="virtual-grid__row"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              height: virtualRow.size,
            }}
          >
            {Array.from({ length: columnCount }, (_, col) => {
              const index = startIndex + col
              if (index >= items.length) return null
              const item = items[index]
              return <div key={getKey(item, index)}>{renderItem(item, index)}</div>
            })}
          </div>
        )
      })}
      {footer ? (
        <div
          style={{
            position: 'absolute',
            top: virtualizer.getTotalSize(),
            left: 0,
            width: '100%',
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
