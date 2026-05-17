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

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      const workspace = workspaceRef.current
      if (!workspace) return

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        const rect = workspace.getBoundingClientRect()
        const x = ev.clientX - rect.left
        let pct = (x / rect.width) * 100
        if (prefs.panelFirst) {
          pct = clamp(pct, 22, 78)
        } else {
          pct = clamp(pct, 22, 78)
        }
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
    [prefs.panelFirst, setPrefs],
  )

  const previewStyle = { flex: `0 0 ${prefs.splitPercent}%` }
  const panelStyle = { flex: `0 0 ${100 - prefs.splitPercent}%`, minWidth: 260 }

  const previewPane = (
    <section className="dev-hub-preview" style={previewStyle}>
      {preview}
    </section>
  )

  const panelPane = (
    <aside className="dev-hub-panel" style={panelStyle}>
      {panel}
    </aside>
  )

  return (
    <div className="dev-hub-workspace-wrap">
      <div className="dev-hub-workspace-toolbar">
        <span className="dev-hub-workspace-toolbar-label">Layout</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-inline"
          onClick={() => setPrefs({ panelFirst: !prefs.panelFirst })}
          title="Swap panel side"
        >
          <ArrowLeftRight size={14} />
          Swap panels
        </button>
        <button type="button" className="btn btn-ghost btn-sm btn-inline" onClick={resetLayout} title="Reset layout">
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div
        ref={workspaceRef}
        className={`dev-hub-workspace dev-hub-workspace--flex ${prefs.panelFirst ? 'dev-hub-workspace--flipped' : ''}`}
      >
        {prefs.panelFirst ? (
          <>
            {panelPane}
            <div
              className="dev-hub-resize-handle"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panels"
              onMouseDown={onResizeStart}
            />
            {previewPane}
          </>
        ) : (
          <>
            {previewPane}
            <div
              className="dev-hub-resize-handle"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panels"
              onMouseDown={onResizeStart}
            />
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
