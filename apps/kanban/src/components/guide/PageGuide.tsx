'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { PageGuideConfig } from '@/lib/page-guides'
import { guideStorageKey } from '@/lib/page-guides'

export function PageGuide({ guide }: { guide: PageGuideConfig }) {
  const [dismissed, setDismissed] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const key = guideStorageKey(guide.id)
    const wasDismissed = typeof window !== 'undefined' && localStorage.getItem(key) === 'true'
    setDismissed(wasDismissed)
    setExpanded(!wasDismissed)
  }, [guide.id])

  const dismiss = () => {
    localStorage.setItem(guideStorageKey(guide.id), 'true')
    setDismissed(true)
    setExpanded(false)
  }

  const reopen = () => {
    localStorage.removeItem(guideStorageKey(guide.id))
    setDismissed(false)
    setExpanded(true)
  }

  if (dismissed && !expanded) {
    return (
      <button
        type="button"
        className="page-guide-fab"
        onClick={reopen}
        aria-label={`Show guide for ${guide.pageTitle}`}
      >
        <BookOpen size={16} />
        Guide
      </button>
    )
  }

  return (
    <aside className="page-guide" aria-label={`${guide.pageTitle} guide`}>
      <div className="page-guide-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={18} style={{ color: 'var(--brand)' }} />
          <strong style={{ fontSize: '0.85rem', letterSpacing: '-0.02em' }}>{guide.pageTitle} guide</strong>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            className="page-guide-icon-btn"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse guide' : 'Expand guide'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button type="button" className="page-guide-icon-btn" onClick={dismiss} aria-label="Dismiss guide">
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="page-guide-body">
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
            {guide.summary}
          </p>
          <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {guide.steps.map((step) => (
              <li key={step.title} style={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{step.title}</span>
                <span style={{ color: 'var(--text-sub)' }}> — {step.body}</span>
              </li>
            ))}
          </ol>
          {guide.actions && guide.actions.length > 0 && (
            <div className="page-guide-actions">
              {guide.actions.map((a) => (
                <div key={a.label} className="page-guide-action-chip">
                  <span style={{ fontWeight: 800, color: 'var(--brand)' }}>{a.label}</span>
                  <span style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>{a.hint}</span>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="page-guide-dismiss" onClick={dismiss}>
            Got it — hide guide
          </button>
        </div>
      )}
    </aside>
  )
}
