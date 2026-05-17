'use client'

import { useCallback, useRef } from 'react'
import { ArrowLeftRight, RotateCcw } from 'lucide-react'
import type { WorkspaceLayoutPrefs } from './useWorkspaceLayout'

type Props = {
  prefs: WorkspaceLayoutPrefs
  setPrefs: (patch: Partial<WorkspaceLayoutPrefs>) => void
  resetLayout: () => void
  preview: React.ReactNode
  panel: React.ReactNode
}

export function ResizableWorkspace({ prefs, setPrefs, resetLayout, preview, panel }: Props) {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const mode = prefs.previewMode
  const isMax = mode === 'maximized'
  const isMin = mode === 'minimized'
  const canResize = mode === 'normal'

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!canResize) return
      e.preventDefault()
      dragging.current = true
      const workspace = workspaceRef.current
      if (!workspace) return

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        const rect = workspace.getBoundingClientRect()
        const x = ev.clientX - rect.left
        const pct = clamp((x / rect.width) * 100, 22, 78)
        setPrefs({ splitPercent: pct })
      }

      const onUp = () => {
        dragging.current = false
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [canResize, setPrefs],
  )

  const previewStyle = isMax
    ? { flex: '1 1 100%', width: '100%', maxWidth: '100%' }
    : isMin
      ? { flex: '0 0 auto', width: '100%', maxHeight: '3.35rem', minHeight: 0 }
      : { flex: `0 0 ${prefs.splitPercent}%` }

  const panelStyle = isMax
    ? { flex: '0 0 0', width: 0, minWidth: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' as const }
    : isMin
      ? { flex: '1 1 auto', width: '100%', minWidth: 0 }
      : { flex: `0 0 ${100 - prefs.splitPercent}%`, minWidth: 260 }

  const previewPane = (
    <section className={`dev-hub-preview ${isMax ? 'dev-hub-preview--maximized' : ''} ${isMin ? 'dev-hub-preview--minimized' : ''}`} style={previewStyle}>
      {preview}
    </section>
  )

  const panelPane = (
    <aside className={`dev-hub-panel ${isMax ? 'dev-hub-panel--hidden' : ''}`} style={panelStyle} aria-hidden={isMax}>
      {panel}
    </aside>
  )

  const handle = canResize ? (
    <div
      className="dev-hub-resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panels"
      onMouseDown={onResizeStart}
    />
  ) : null

  return (
    <div className="dev-hub-workspace-wrap">
      <div className="dev-hub-workspace-toolbar">
        <span className="dev-hub-workspace-toolbar-label">Layout</span>
        <button
          type="button"
          className="dev-hub-action-btn btn btn-ghost btn-sm btn-inline dev-hub-tap"
          onClick={() => setPrefs({ panelFirst: !prefs.panelFirst })}
          title="Swap panel side"
        >
          <ArrowLeftRight size={14} />
          Swap panels
        </button>
        <button
          type="button"
          className="dev-hub-action-btn btn btn-ghost btn-sm btn-inline dev-hub-tap"
          onClick={resetLayout}
          title="Reset layout"
        >
          <RotateCcw size={14} />
          Reset
        </button>
        {isMax && (
          <span className="dev-hub-workspace-hint">Fullscreen preview · Esc to exit</span>
        )}
      </div>

      <div
        ref={workspaceRef}
        className={`dev-hub-workspace dev-hub-workspace--flex dev-hub-workspace--preview-${mode} ${prefs.panelFirst ? 'dev-hub-workspace--flipped' : ''}`}
      >
        {prefs.panelFirst ? (
          <>
            {panelPane}
            {handle}
            {previewPane}
          </>
        ) : (
          <>
            {previewPane}
            {handle}
            {panelPane}
          </>
        )}
      </div>
    </div>
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
