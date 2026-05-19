'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export type CategoryNavItem = {
  id: string
  label: string
  href: string
}

type Props = {
  items: CategoryNavItem[]
  activeId: string
  allHref: string
  allLabel?: string
  className?: string
}

export function CategoryNavDropdown({
  items,
  activeId,
  allHref,
  allLabel = 'All categories',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const activeLabel = items.find((i) => i.id === activeId)?.label ?? allLabel

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`cat-nav-dropdown${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="cat-nav-dropdown__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cat-nav-dropdown__label">Categories</span>
        <span className="cat-nav-dropdown__value">{activeLabel}</span>
        <ChevronDown size={16} className={open ? 'cat-nav-dropdown__chev--open' : undefined} aria-hidden />
      </button>
      {open ? (
        <ul id={listId} className="cat-nav-dropdown__menu" role="listbox" aria-label="Categories">
          <li role="option" aria-selected={activeId === 'all'}>
            <Link
              href={allHref}
              className={`cat-nav-dropdown__link${activeId === 'all' ? ' cat-nav-dropdown__link--active' : ''}`}
              onClick={() => setOpen(false)}
              prefetch
            >
              {allLabel}
            </Link>
          </li>
          {items.map((item) => (
            <li key={item.id} role="option" aria-selected={activeId === item.id}>
              <Link
                href={item.href}
                className={`cat-nav-dropdown__link${activeId === item.id ? ' cat-nav-dropdown__link--active' : ''}`}
                onClick={() => setOpen(false)}
                prefetch
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
