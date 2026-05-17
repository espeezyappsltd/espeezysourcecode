'use client'

import { useCallback, useState } from 'react'
import { DevHubShell } from '@/components/dev-hub/DevHubShell'
import { FleetControls } from '@/components/dev-hub/FleetControls'
import { MetricsBar } from '@/components/dev-hub/MetricsBar'
import { ProdFleet } from '@/components/dev-hub/ProdFleet'
import { AppCard } from '@/components/dev-hub/AppCard'
import { usePoll } from '@/components/dev-hub/usePoll'
import type { DevAppRow, HubMetrics, ProdFleetRow } from '@/components/dev-hub/types'

const EMPTY_METRICS: HubMetrics = {
  totalApps: 0,
  running: 0,
  stopped: 0,
  errors: 0,
  hubPort: 3000,
  prodTotal: 0,
  prodOnline: 0,
  prodOffline: 0,
  avgLatencyMs: null,
}

export default function DashboardPage() {
  const [apps, setApps] = useState<DevAppRow[]>([])
  const [prodFleet, setProdFleet] = useState<ProdFleetRow[]>([])
  const [metrics, setMetrics] = useState<HubMetrics>(EMPTY_METRICS)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [fleetBusy, setFleetBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/dev/apps', { cache: 'no-store' })
      if (!res.ok) {
        setLoadError('Failed to load apps')
        return
      }
      const data = await res.json()
      setApps(data.apps ?? [])
      setProdFleet(data.prodFleet ?? [])
      setMetrics({ ...EMPTY_METRICS, ...(data.metrics ?? {}) })
      setLoadError(null)
    } catch {
      setLoadError('Network error')
    }
  }, [])

  usePoll(refresh, 12_000)

  async function control(appId: string, action: 'start' | 'stop' | 'debug', port?: number) {
    setBusyId(appId)
    try {
      const path = action === 'debug' ? 'debug' : action
      const needsBody = (action === 'start' || action === 'debug') && port != null
      await fetch(`/api/dev/apps/${appId}/${path}`, {
        method: 'POST',
        headers: needsBody ? { 'Content-Type': 'application/json' } : undefined,
        body: needsBody ? JSON.stringify({ port }) : undefined,
      })
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function fleetAction(action: 'start-all' | 'stop-all') {
    setFleetBusy(true)
    try {
      await fetch('/api/dev/apps/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      await refresh()
    } finally {
      setFleetBusy(false)
    }
  }

  return (
    <DevHubShell
      title="Espeezy Command Center"
      subtitle="Run · debug · monitor — lightweight hub on :3000 · apps on configurable ports"
    >
      <MetricsBar metrics={metrics} />
      {loadError && <p className="error-message dev-hub-alert">{loadError}</p>}

      <ProdFleet fleet={prodFleet} />

      <section className="dev-hub-section dev-hub-section--local">
        <div className="dev-hub-section-head">
          <div className="dev-hub-section-eyebrow dev-hub-section-eyebrow--local">Local workspace</div>
          <h2 className="dev-hub-section-title">Development servers</h2>
          <p className="dev-hub-section-desc">
            Start, debug with Node inspector, and watch RAM/CPU per app. Open a workspace for logs, preview, and shell.
          </p>
          <FleetControls
            metrics={metrics}
            busy={fleetBusy}
            onStartAll={() => void fleetAction('start-all')}
            onStopAll={() => void fleetAction('stop-all')}
            onRefresh={() => void refresh()}
          />
        </div>

        <div className="dev-hub-apps">
          {apps.map((app, i) => (
            <AppCard
              key={app.id}
              app={app}
              busy={busyId === app.id}
              prodStatus={prodFleet.find((p) => p.appId === app.id)}
              style={{ animationDelay: `${i * 0.04}s` }}
              onStart={(port) => void control(app.id, 'start', port)}
              onDebug={(port) => void control(app.id, 'debug', port)}
              onStop={() => void control(app.id, 'stop')}
              onRefresh={() => void refresh()}
            />
          ))}
        </div>

        {apps.length === 0 && !loadError && (
          <p className="dev-hub-empty">Synchronizing local app registry…</p>
        )}
      </section>
    </DevHubShell>
  )
}
