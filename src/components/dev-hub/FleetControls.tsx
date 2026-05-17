'use client'

import { Bug, Play, RefreshCw, Square } from 'lucide-react'
import type { HubMetrics } from './types'

type Props = {
  metrics: HubMetrics
  busy: boolean
  onStartAll: () => void
  onStopAll: () => void
  onRefresh: () => void
}

export function FleetControls({ metrics, busy, onStartAll, onStopAll, onRefresh }: Props) {
  return (
    <div className="dev-hub-fleet-controls" role="toolbar" aria-label="Fleet controls">
      <button type="button" className="btn btn-success btn-sm" disabled={busy} onClick={onStartAll}>
        <Play size={14} aria-hidden />
        Start all
      </button>
      <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={onStopAll}>
        <Square size={14} aria-hidden />
        Stop all
      </button>
      <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={onRefresh}>
        <RefreshCw size={14} aria-hidden />
        Refresh
      </button>
      <span className="dev-hub-fleet-hint">
        <Bug size={12} aria-hidden />
        Debug attaches Node inspector (ports 9231–9236). Hub uses ~{metrics.hubMemoryMb ?? '—'} MB RAM.
      </span>
    </div>
  )
}
