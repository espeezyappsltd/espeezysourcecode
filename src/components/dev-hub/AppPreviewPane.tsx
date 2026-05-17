'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  Accessibility,
  Maximize2,
  Minimize2,
  Minus,
  RefreshCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { PortControl } from './PortControl'
import type { PreviewA11yPrefs, PreviewDisplayMode } from './useWorkspaceLayout'

type Props = {
  appId: string
  appName: string
  port: number
  defaultPort: number
  localHost: string
  previewUrl: string
  effectivePort: number
  status: string
  healthy: boolean
  warmingUp: boolean
  isActive: boolean
  showPreview: boolean
  iframeKey: number
  actionBusy: string | null
  previewMode: PreviewDisplayMode
  a11y: PreviewA11yPrefs
  onPreviewMode: (mode: PreviewDisplayMode) => void
  onA11y: (patch: Partial<PreviewA11yPrefs>) => void
  onPortDraft: (port: number) => void
  onRefreshApp: () => void
  onRefreshIframe: () => void
  onStart: () => void
}

const ZOOM_STEPS = [75, 90, 100, 110, 125, 150, 175, 200] as const

export function AppPreviewPane({
  appId,
  appName,
  port,
  defaultPort,
  localHost,
  previewUrl,
  effectivePort,
  status,
  healthy,
  warmingUp,
  isActive,
  showPreview,
  iframeKey,
  actionBusy,
  previewMode,
  a11y,
  onPreviewMode,
  onA11y,
  onPortDraft,
  onRefreshApp,
  onRefreshIframe,
  onStart,
}: Props) {
  const a11yMenuId = useId()
  const [a11yOpen, setA11yOpen] = useState(false)
  const a11yRef = useRef<HTMLDivElement>(null)

  const minimized = previewMode === 'minimized'
  const maximized = previewMode === 'maximized'
  const zoom = a11y.zoomPercent / 100

  const cycleMode = useCallback(
    (next: PreviewDisplayMode) => {
      onPreviewMode(next)
    },
    [onPreviewMode],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && maximized) {
        cycleMode('normal')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [maximized, cycleMode])

  useEffect(() => {
    if (!a11yOpen) return
    const onPointer = (e: MouseEvent) => {
      if (!a11yRef.current?.contains(e.target as Node)) setA11yOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    return () => window.removeEventListener('mousedown', onPointer)
  }, [a11yOpen])

  function stepZoom(delta: number) {
    const idx = ZOOM_STEPS.findIndex((z) => z >= a11y.zoomPercent)
    const i = idx < 0 ? ZOOM_STEPS.length - 1 : idx
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, i + delta))]
    onA11y({ zoomPercent: next })
  }

  const displayUrl = previewUrl || `http://${localHost}:${effectivePort}`

  return (
    <div
      className={`dev-hub-preview-root ${minimized ? 'dev-hub-preview-root--min' : ''} ${maximized ? 'dev-hub-preview-root--max' : ''} ${a11y.highContrast ? 'dev-hub-preview-root--contrast' : ''} ${a11y.reducedMotion ? 'dev-hub-preview-root--reduce-motion' : ''}`}
    >
      <div className="dev-hub-preview-bar" role="toolbar" aria-label={`${appName} preview controls`}>
        {!minimized && (
          <PortControl
            appId={appId}
            port={port}
            defaultPort={defaultPort}
            localHost={localHost}
            compact
            deferApply
            disabled={actionBusy !== null}
            onPortDraft={onPortDraft}
            onApplied={onRefreshApp}
          />
        )}

        <span className="dev-hub-preview-url" title={displayUrl}>
          {minimized ? appName : displayUrl}
        </span>

        {!minimized && (
          <span className={`dev-hub-preview-status ${healthy ? 'dev-hub-preview-status--ok' : ''}`}>
            {status}
            {healthy ? ' · ready' : warmingUp ? ' · warming up' : ''}
          </span>
        )}

        <div className="dev-hub-preview-window-controls">
          <button
            type="button"
            className="dev-hub-preview-win-btn dev-hub-tap"
            title={minimized ? 'Restore preview' : 'Minimize preview'}
            aria-label={minimized ? 'Restore preview panel' : 'Minimize preview panel'}
            aria-pressed={minimized}
            onClick={() => cycleMode(minimized ? 'normal' : 'minimized')}
          >
            <Minus size={14} aria-hidden />
          </button>
          <button
            type="button"
            className="dev-hub-preview-win-btn dev-hub-tap"
            title={maximized ? 'Exit fullscreen preview' : 'Fullscreen preview in workspace'}
            aria-label={maximized ? 'Exit fullscreen preview' : 'Fullscreen preview in workspace'}
            aria-pressed={maximized}
            onClick={() => cycleMode(maximized ? 'normal' : 'maximized')}
          >
            {maximized ? <Minimize2 size={14} aria-hidden /> : <Maximize2 size={14} aria-hidden />}
          </button>

          <div className="dev-hub-preview-a11y" ref={a11yRef}>
            <button
              type="button"
              className={`dev-hub-preview-win-btn dev-hub-tap ${a11yOpen ? 'active' : ''}`}
              title="Accessibility options"
              aria-label="Accessibility options"
              aria-expanded={a11yOpen}
              aria-controls={a11yMenuId}
              onClick={() => setA11yOpen((o) => !o)}
            >
              <Accessibility size={14} aria-hidden />
            </button>
            {a11yOpen && (
              <div id={a11yMenuId} className="dev-hub-preview-a11y-menu" role="menu">
                <p className="dev-hub-preview-a11y-label">Preview accessibility</p>
                <div className="dev-hub-preview-a11y-row" role="group" aria-label="Zoom">
                  <button type="button" className="dev-hub-tap" role="menuitem" onClick={() => stepZoom(-1)} aria-label="Zoom out">
                    <ZoomOut size={14} aria-hidden />
                  </button>
                  <span aria-live="polite">{a11y.zoomPercent}%</span>
                  <button type="button" className="dev-hub-tap" role="menuitem" onClick={() => stepZoom(1)} aria-label="Zoom in">
                    <ZoomIn size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="dev-hub-tap"
                    role="menuitem"
                    onClick={() => onA11y({ zoomPercent: 100 })}
                    aria-label="Reset zoom"
                  >
                    <RotateCcw size={12} aria-hidden />
                  </button>
                </div>
                <label className="dev-hub-preview-a11y-check">
                  <input
                    type="checkbox"
                    checked={a11y.highContrast}
                    onChange={(e) => onA11y({ highContrast: e.target.checked })}
                  />
                  High contrast frame
                </label>
                <label className="dev-hub-preview-a11y-check">
                  <input
                    type="checkbox"
                    checked={a11y.reducedMotion}
                    onChange={(e) => onA11y({ reducedMotion: e.target.checked })}
                  />
                  Reduce motion
                </label>
                <a href="#dev-hub-app-preview" className="dev-hub-preview-a11y-skip dev-hub-tap" onClick={() => setA11yOpen(false)}>
                  Skip to app preview
                </a>
              </div>
            )}
          </div>

          {!minimized && (
            <>
              <button
                type="button"
                className="dev-hub-action-btn btn btn-ghost btn-sm btn-inline dev-hub-tap"
                disabled={!isActive}
                onClick={onRefreshIframe}
              >
                <RefreshCw size={14} aria-hidden />
                Refresh
              </button>
              <a
                href={isActive ? previewUrl : undefined}
                target="_blank"
                rel="noreferrer"
                className="dev-hub-action-btn btn btn-secondary btn-sm btn-inline dev-hub-tap"
                style={{ pointerEvents: isActive ? 'auto' : 'none', opacity: isActive ? 1 : 0.4 }}
              >
                New tab
              </a>
            </>
          )}
        </div>
      </div>

      {!minimized && (
        <div id="dev-hub-app-preview" className="dev-hub-iframe-wrap" tabIndex={-1}>
          {showPreview && previewUrl ? (
            <>
              <div
                className="dev-hub-iframe-zoom"
                style={{
                  transform: `scale(${zoom})`,
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                }}
              >
                <iframe key={iframeKey} src={previewUrl} title={`${appName} local preview`} />
              </div>
              {warmingUp && (
                <div className="dev-hub-iframe-loading" aria-live="polite">
                  {!a11y.reducedMotion && <span className="spinner-mini" />}
                  Starting {appName}…
                </div>
              )}
            </>
          ) : (
            <div className="dev-hub-iframe-placeholder">
              <p>{status === 'error' ? 'App failed to start. Check logs.' : 'App is not running.'}</p>
              <button
                type="button"
                className="dev-hub-action-btn btn btn-success btn-inline dev-hub-tap"
                disabled={actionBusy !== null}
                onClick={onStart}
              >
                {actionBusy === 'start' ? 'Starting…' : `Start ${appName}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
