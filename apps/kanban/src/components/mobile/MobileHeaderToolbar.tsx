'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Filter, Search, X } from 'lucide-react'
import { useMobilePageControlsContext } from './MobilePageControlsContext'
import './mobile-page-controls.css'

type OpenSheet = 'search' | 'filter' | null

export function MobileHeaderToolbar() {
  const { controls } = useMobilePageControlsContext() ?? {}
  const [open, setOpen] = useState<OpenSheet>(null)
  const [mounted, setMounted] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open === 'search') {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 120)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!controls || (!controls.search && !controls.filterPanels?.length && !controls.actions?.length)) {
    return null
  }

  const hasSearch = Boolean(controls.search)
  const hasFilters = Boolean(controls.filterPanels?.length)
  const searchActive = Boolean(controls.search?.value?.trim())
  const hasCoreCluster = hasSearch || hasFilters

  const toggleSheet = (sheet: OpenSheet) => {
    setOpen((prev) => (prev === sheet ? null : sheet))
  }

  return (
    <>
      <div className="mobile-header__tools hide-desktop" aria-label="Page tools">
        {hasCoreCluster && (
          <div className="mobile-header__tool-cluster" role="group" aria-label="Search and filters">
            {hasSearch && (
              <button
                type="button"
                className={`mobile-header__tool-segment${open === 'search' || searchActive ? ' mobile-header__tool-segment--active' : ''}`}
                onClick={() => toggleSheet('search')}
                aria-label="Search"
                aria-pressed={open === 'search'}
                aria-expanded={open === 'search'}
              >
                <Search size={17} strokeWidth={2.25} />
              </button>
            )}
            {hasSearch && hasFilters && (
              <span className="mobile-header__tool-divider" aria-hidden />
            )}
            {hasFilters && (
              <button
                type="button"
                className={`mobile-header__tool-segment${open === 'filter' ? ' mobile-header__tool-segment--active' : ''}`}
                onClick={() => toggleSheet('filter')}
                aria-label="Filters"
                aria-pressed={open === 'filter'}
                aria-expanded={open === 'filter'}
              >
                <Filter size={17} strokeWidth={2.25} />
              </button>
            )}
          </div>
        )}

        {controls.actions && controls.actions.length > 0 && (
          <div
            className="mobile-header__tool-cluster mobile-header__tool-cluster--actions"
            role="group"
            aria-label="Quick actions"
          >
            {controls.actions.map((action, index) => (
              <span key={action.id} style={{ display: 'contents' }}>
                {index > 0 && <span className="mobile-header__tool-divider" aria-hidden />}
                <button
                  type="button"
                  className={`mobile-header__tool-segment mobile-header__tool-segment--${action.variant ?? 'ghost'}`}
                  onClick={() => {
                    setOpen(null)
                    action.onClick()
                  }}
                  aria-label={action.label}
                >
                  {action.icon}
                  {action.badge != null && Number(action.badge) > 0 && (
                    <span className="mobile-header__tool-badge" aria-hidden>
                      {typeof action.badge === 'number' && action.badge > 9 ? '9+' : action.badge}
                    </span>
                  )}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.button
                  type="button"
                  className="mobile-ctrl-backdrop"
                  aria-label="Close panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(null)}
                />
                <motion.div
                  className="mobile-ctrl-sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mobile-ctrl-sheet-title"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                >
                  <div className="mobile-ctrl-sheet__handle" aria-hidden />
                  <div className="mobile-ctrl-sheet__head">
                    <h2 id="mobile-ctrl-sheet-title" className="mobile-ctrl-sheet__title">
                      {open === 'search' ? 'Search' : controls.filterPanels?.[0]?.label ?? 'Filters'}
                    </h2>
                    <button
                      type="button"
                      className="mobile-ctrl-sheet__close"
                      onClick={() => setOpen(null)}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mobile-ctrl-sheet__body">
                    {open === 'search' && controls.search && (
                      <div className="mobile-ctrl-search">
                        <Search size={18} className="mobile-ctrl-search__icon" aria-hidden />
                        <input
                          ref={searchInputRef}
                          type="search"
                          className="mobile-ctrl-search__input"
                          placeholder={controls.search.placeholder ?? 'Search…'}
                          value={controls.search.value}
                          onChange={(e) => controls.search?.onChange(e.target.value)}
                          enterKeyHint="search"
                        />
                        {controls.search.value && (
                          <button
                            type="button"
                            className="mobile-ctrl-search__clear"
                            onClick={() => {
                              controls.search?.onClear?.()
                              controls.search?.onChange('')
                              searchInputRef.current?.focus()
                            }}
                            aria-label="Clear search"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )}
                    {open === 'filter' &&
                      controls.filterPanels?.map((panel) => (
                        <div key={panel.id} className="mobile-ctrl-filter-block">
                          {controls.filterPanels && controls.filterPanels.length > 1 && (
                            <p className="mobile-ctrl-filter-block__label">{panel.label}</p>
                          )}
                          {panel.content}
                        </div>
                      ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
