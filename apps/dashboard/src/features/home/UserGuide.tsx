'use client'

import { useEffect, useId, useState } from 'react'
import { X, ChevronDown, Keyboard } from 'lucide-react'
import AppCopyrightStrip from '@shared/AppCopyrightStrip'
import { KEYBOARD_SHORTCUTS, USER_GUIDE_SECTIONS } from './content'

export function UserGuide() {
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(USER_GUIDE_SECTIONS[0]?.id ?? null)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-kanban-user-guide', handler)
    return () => window.removeEventListener('open-kanban-user-guide', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="kanban-guide-overlay" role="presentation" onClick={() => setOpen(false)}>
      <div
        className="kanban-guide-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="kanban-guide-header">
          <div>
            <h2 id={titleId} className="kanban-guide-title">
              Kanban user guide
            </h2>
            <p className="kanban-guide-subtitle">Complete reference for Kanban Home and your workspace.</p>
          </div>
          <button type="button" className="kanban-guide-close" aria-label="Close user guide" onClick={() => setOpen(false)}>
            <X size={22} aria-hidden />
          </button>
        </header>

        <div className="kanban-guide-body">
          {USER_GUIDE_SECTIONS.map((section) => {
            const isOpen = expanded === section.id
            return (
              <article key={section.id} className="kanban-guide-section">
                <h3>
                  <button
                    type="button"
                    className="kanban-guide-section-btn"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : section.id)}
                  >
                    <span>{section.title}</span>
                    <ChevronDown size={18} className={isOpen ? 'kanban-guide-chevron--open' : ''} aria-hidden />
                  </button>
                </h3>
                {isOpen && (
                  <div className="kanban-guide-section-body">
                    <p>{section.summary}</p>
                    <ol>
                      {section.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    {section.tips && section.tips.length > 0 && (
                      <ul className="kanban-guide-tips">
                        {section.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            )
          })}

          <section className="kanban-guide-keyboard" aria-labelledby="kanban-shortcuts-heading">
            <h3 id="kanban-shortcuts-heading" className="kanban-guide-keyboard-title">
              <Keyboard size={18} aria-hidden /> Keyboard shortcuts
            </h3>
            <table className="kanban-guide-table">
              <thead>
                <tr>
                  <th scope="col">Keys</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {KEYBOARD_SHORTCUTS.map(({ keys, action }) => (
                  <tr key={keys}>
                    <td>
                      <kbd>{keys}</kbd>
                    </td>
                    <td>{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <AppCopyrightStrip style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(15,23,42,0.08)', color: '#64748b' }} />
        </div>
      </div>
    </div>
  )
}
