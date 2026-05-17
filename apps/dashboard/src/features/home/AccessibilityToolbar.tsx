'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  Accessibility,
  BookOpen,
  Link2,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useA11y } from './AccessibilityProvider'

export function AccessibilityToolbar() {
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const a11y = useA11y()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const openGuide = () => {
      setOpen(false)
      window.dispatchEvent(new CustomEvent('open-kanban-user-guide'))
    }
    window.addEventListener('open-help-tray', openGuide)
    return () => window.removeEventListener('open-help-tray', openGuide)
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    return () => window.removeEventListener('mousedown', onPointer)
  }, [open])

  return (
    <div className="kanban-a11y-toolbar" ref={panelRef} id="accessibility">
      <button
        type="button"
        className="kanban-a11y-fab"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Accessibility and help options"
        onClick={() => setOpen((o) => !o)}
      >
        <Accessibility size={20} aria-hidden />
        <span className="kanban-a11y-fab-label">Accessibility</span>
      </button>

      {open && (
        <div id={menuId} className="kanban-a11y-panel" role="region" aria-label="Accessibility settings">
          <p className="kanban-a11y-panel-title">Accessibility</p>

          <div className="kanban-a11y-row" role="group" aria-label="Text size">
            <span className="kanban-a11y-row-label">Text size</span>
            <div className="kanban-a11y-row-controls">
              <button type="button" className="kanban-a11y-icon-btn" aria-label="Decrease text size" onClick={() => a11y.bumpFontScale(-10)}>
                <Minus size={16} aria-hidden />
              </button>
              <span className="kanban-a11y-scale" aria-live="polite">
                {a11y.fontScale}%
              </span>
              <button type="button" className="kanban-a11y-icon-btn" aria-label="Increase text size" onClick={() => a11y.bumpFontScale(10)}>
                <Plus size={16} aria-hidden />
              </button>
            </div>
          </div>

          <label className="kanban-a11y-check">
            <input type="checkbox" checked={a11y.highContrast} onChange={(e) => a11y.setHighContrast(e.target.checked)} />
            High contrast
          </label>
          <label className="kanban-a11y-check">
            <input type="checkbox" checked={a11y.reducedMotion} onChange={(e) => a11y.setReducedMotion(e.target.checked)} />
            Reduce motion
          </label>
          <label className="kanban-a11y-check">
            <input type="checkbox" checked={a11y.underlineLinks} onChange={(e) => a11y.setUnderlineLinks(e.target.checked)} />
            <Link2 size={14} aria-hidden /> Underline links
          </label>

          <div className="kanban-a11y-panel-actions">
            <button
              type="button"
              className="kanban-a11y-action"
              onClick={() => {
                setOpen(false)
                window.dispatchEvent(new CustomEvent('open-kanban-user-guide'))
              }}
            >
              <BookOpen size={16} aria-hidden />
              Full user guide
            </button>
            <button type="button" className="kanban-a11y-action kanban-a11y-action--ghost" onClick={a11y.resetA11y}>
              <RotateCcw size={14} aria-hidden />
              Reset
            </button>
          </div>

          <p className="kanban-a11y-hint">
            <Sparkles size={12} aria-hidden /> Settings save automatically in this browser.
          </p>
        </div>
      )}
    </div>
  )
}
