'use client'

import { useEffect } from 'react'

const SILENT_REFRESH_MS = 5_000

export type SilentWorkspaceRefreshOptions = {
  groupId: string | null | undefined
  /** When false, polling is paused (e.g. landing gate before workspace enter). */
  enabled?: boolean
}

/**
 * Background refresh while the user is on the dashboard — no spinners or toasts.
 * Pauses when the tab is hidden to save battery and avoid stale races.
 */
export function useSilentWorkspaceRefresh({ groupId, enabled = true }: SilentWorkspaceRefreshOptions) {
  useEffect(() => {
    if (!groupId || !enabled) return

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      const detail = { groupId, silent: true as const }
      window.dispatchEvent(new CustomEvent('espeezy-kanban-metrics-refresh', { detail }))
      window.dispatchEvent(new CustomEvent('espeezy-kanban-board-refresh', { detail }))
    }

    const intervalId = window.setInterval(tick, SILENT_REFRESH_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [groupId, enabled])
}
