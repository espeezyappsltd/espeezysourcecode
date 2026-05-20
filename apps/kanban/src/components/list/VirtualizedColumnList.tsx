'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { VIRTUALIZE_THRESHOLD } from '@/lib/list/viewport-list'
import './list-virtual.css'

type Props<T> = {
  items: T[]
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  estimateSize?: number
  gapPx?: number
  className?: string
  footer?: ReactNode
}

export function VirtualizedColumnList<T>({
  items,
  getKey,
  renderItem,
  estimateSize = 148,
  gapPx = 9,
  className = '',
  footer,
}: Props<T>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const useVirtual = items.length >= VIRTUALIZE_THRESHOLD

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => setScrollMargin(el.offsetTop)
    measure()
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
  }, [items.length, useVirtual])

  const virtualizer = useWindowVirtualizer({
    count: useVirtual ? items.length : 0,
    estimateSize: () => estimateSize + gapPx,
    overscan: 5,
    scrollMargin,
  })

  if (!useVirtual) {
    return (
      <div ref={rootRef} className={className} style={{ display: 'flex', flexDirection: 'column', gap: gapPx }}>
        {items.map((item, index) => (
          <div key={getKey(item, index)}>{renderItem(item, index)}</div>
        ))}
        {footer}
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={`virtual-list ${className}`.trim()}
      style={
        {
          height: virtualizer.getTotalSize(),
          position: 'relative',
          '--virtual-gap': `${gapPx}px`,
        } as React.CSSProperties
      }
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index]
        return (
          <div
            key={getKey(item, virtualRow.index)}
            className="virtual-list__row"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
            }}
          >
            {renderItem(item, virtualRow.index)}
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
