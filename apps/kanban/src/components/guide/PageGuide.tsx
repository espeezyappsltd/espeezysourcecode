'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import type { PageGuideConfig, PageGuideTheme } from '@/lib/page-guides'
import { guideStorageKey } from '@/lib/page-guides'
import './page-guide-sheet.css'

function resolveTheme(guide: PageGuideConfig): PageGuideTheme {
  if (guide.theme) return guide.theme
  if (guide.id === 'feed') return 'journeys'
  if (guide.id === 'marketplace') return 'marketplace'
  if (guide.id === 'hustle') return 'hustle'
  return 'default'
}

export function PageGuide({ guide }: { guide: PageGuideConfig }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [showDot, setShowDot] = useState(false)
  const theme = resolveTheme(guide)

  useEffect(() => {
    setMounted(true)
    const wasDismissed = localStorage.getItem(guideStorageKey(guide.id)) === 'true'
    setShowDot(!wasDismissed)
    if (!wasDismissed) {
      const t = window.setTimeout(() => setOpen(true), 700)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [guide.id])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const dismiss = useCallback(() => {
    localStorage.setItem(guideStorageKey(guide.id), 'true')
    setShowDot(false)
    setOpen(false)
  }, [guide.id])

  const toggle = () => {
    setOpen((v) => !v)
    if (!open) setShowDot(false)
  }

  if (!mounted) return null

  return createPortal(
    <motion.div className="social-guide-root" aria-hidden={!open && !showDot}>
      <button
        type="button"
        className={`social-guide-fab${open ? ' social-guide-fab--open' : ''}`}
        data-theme={theme}
        onClick={toggle}
        aria-label={open ? 'Close guide' : `Tips for ${guide.pageTitle}`}
        aria-expanded={open}
      >
        {showDot && !open && <span className="social-guide-fab__dot" aria-hidden />}
        {open ? <X size={22} strokeWidth={2.5} /> : <Sparkles size={22} strokeWidth={2.5} />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              className="social-guide-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              aria-label="Close guide"
            />
            <motion.div
              className="social-guide-sheet"
              data-theme={theme}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`guide-title-${guide.id}`}
              initial={{ y: '100%', opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="social-guide-handle" aria-hidden />

              <div className="social-guide-hero">
                <div className="social-guide-hero__row">
                  {guide.emoji && (
                    <span className="social-guide-emoji" aria-hidden>
                      {guide.emoji}
                    </span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 id={`guide-title-${guide.id}`} className="social-guide-hero__title">
                      {guide.pageTitle}
                    </h2>
                    <p className="social-guide-hero__summary">{guide.summary}</p>
                  </div>
                  <button
                    type="button"
                    className="social-guide-close print-hide"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="social-guide-body">
                <ol className="social-guide-steps">
                  {guide.steps.map((step, i) => (
                    <li key={step.title} className="social-guide-step">
                      <span className="social-guide-step__num" aria-hidden>
                        {i + 1}
                      </span>
                      <div>
                        <p className="social-guide-step__title">{step.title}</p>
                        <p className="social-guide-step__body">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {guide.actions && guide.actions.length > 0 && (
                <div className="social-guide-actions" role="list">
                  {guide.actions.map((a) => (
                    <div key={a.label} className="social-guide-action" role="listitem">
                      <span className="social-guide-action__label">{a.label}</span>
                      <span className="social-guide-action__hint">{a.hint}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="social-guide-footer">
                <button type="button" className="social-guide-cta" onClick={dismiss}>
                  Got it
                </button>
                <button type="button" className="social-guide-skip" onClick={dismiss}>
                  Don&apos;t show tips again
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  )
}
