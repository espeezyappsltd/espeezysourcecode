'use client'

import { useCallback, useEffect, useState } from 'react'

export type WorkspaceTab = 'logs' | 'terminal'

export type WorkspaceLayoutPrefs = {
  /** Preview pane width as % of workspace (20–80). */
  splitPercent: number
  /** When true, control panel is on the left. */
  panelFirst: boolean
  tab: WorkspaceTab
}

const STORAGE_KEY = 'espeezy-dev-hub-workspace-layout:v1'

const DEFAULT_PREFS: WorkspaceLayoutPrefs = {
  splitPercent: 68,
  panelFirst: false,
  tab: 'logs',
}

type StoredLayout = {
  default?: Partial<WorkspaceLayoutPrefs>
  apps?: Record<string, Partial<WorkspaceLayoutPrefs>>
}

function readStore(): StoredLayout {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredLayout) : {}
  } catch {
    return {}
  }
}

function writeStore(store: StoredLayout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function mergePrefs(appId: string): WorkspaceLayoutPrefs {
  const store = readStore()
  const appPrefs = store.apps?.[appId] ?? {}
  const globalPrefs = store.default ?? {}
  return {
    ...DEFAULT_PREFS,
    ...globalPrefs,
    ...appPrefs,
    splitPercent: clamp(
      appPrefs.splitPercent ?? globalPrefs.splitPercent ?? DEFAULT_PREFS.splitPercent,
      22,
      78,
    ),
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function useWorkspaceLayout(appId: string) {
  const [prefs, setPrefsState] = useState<WorkspaceLayoutPrefs>(DEFAULT_PREFS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPrefsState(mergePrefs(appId))
    setHydrated(true)
  }, [appId])

  const persist = useCallback(
    (next: WorkspaceLayoutPrefs) => {
      const store = readStore()
      store.apps = { ...store.apps, [appId]: next }
      writeStore(store)
    },
    [appId],
  )

  const setPrefs = useCallback(
    (patch: Partial<WorkspaceLayoutPrefs>) => {
      setPrefsState((prev) => {
        const next = {
          ...prev,
          ...patch,
          ...(patch.splitPercent != null
            ? { splitPercent: clamp(patch.splitPercent, 22, 78) }
            : {}),
        }
        persist(next)
        return next
      })
    },
    [persist],
  )

  const resetLayout = useCallback(() => {
    setPrefsState(DEFAULT_PREFS)
    persist(DEFAULT_PREFS)
  }, [persist])

  return { prefs, setPrefs, resetLayout, hydrated }
}
