'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { usePoll } from './usePoll'
import type { DevAppRow, HubMetrics } from './types'

type DevHubNavState = {
  apps: DevAppRow[]
  metrics: HubMetrics | null
  refresh: () => Promise<void>
}

const DevHubNavContext = createContext<DevHubNavState | null>(null)

const EMPTY_METRICS: HubMetrics = {
  totalApps: 0,
  running: 0,
  stopped: 0,
  errors: 0,
  hubPort: 3000,
}

export function DevHubNavProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<DevAppRow[]>([])
  const [metrics, setMetrics] = useState<HubMetrics | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/dev/apps', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setApps(data.apps ?? [])
      setMetrics({ ...EMPTY_METRICS, ...(data.metrics ?? {}) })
    } catch {
      // Sidebar degrades gracefully without live status.
    }
  }, [])

  usePoll(refresh, 12_000)

  const value = useMemo(
    () => ({
      apps,
      metrics,
      refresh,
    }),
    [apps, metrics, refresh],
  )

  return <DevHubNavContext.Provider value={value}>{children}</DevHubNavContext.Provider>
}

export function useDevHubNav(): DevHubNavState {
  const ctx = useContext(DevHubNavContext)
  if (!ctx) {
    return {
      apps: [],
      metrics: null,
      refresh: async () => {},
    }
  }
  return ctx
}
