'use client'

import { useCallback, useState } from 'react'
import { DevHubShell } from '@/components/dev-hub/DevHubShell'
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

  usePoll(refresh, 15000)

  async function control(appId: string, action: 'start' | 'stop') {
    setBusyId(appId)
    try {
      await fetch(`/api/dev/apps/${appId}/${action}`, { method: 'POST' })
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DevHubShell
      title="Espeezy Command Center"
      subtitle="Production fleet · local dev control · monorepo apps/"
    >
      <MetricsBar metrics={metrics} />
      {loadError && <p className="error-message dev-hub-alert">{loadError}</p>}

      <ProdFleet fleet={prodFleet} />

      <section className="dev-hub-section dev-hub-section--local">
        <div className="dev-hub-section-head">
          <div className="dev-hub-section-eyebrow dev-hub-section-eyebrow--local">Local workspace</div>
          <h2 className="dev-hub-section-title">Development servers</h2>
          <p className="dev-hub-section-desc">
            Start and stop apps on this machine. Open a workspace for logs, preview, and shell.
          </p>
        </div>

        <div className="dev-hub-apps">
          {apps.map((app, i) => (
            <AppCard
              key={app.id}
              app={app}
              busy={busyId === app.id}
              prodStatus={prodFleet.find((p) => p.appId === app.id)}
              style={{ animationDelay: `${i * 0.04}s` }}
              onStart={() => void control(app.id, 'start')}
              onStop={() => void control(app.id, 'stop')}
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
