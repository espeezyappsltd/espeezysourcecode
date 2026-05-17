'use client'

import { useCallback, useEffect, useState } from 'react'

export type WorkspaceTab = 'logs' | 'terminal'

export type PreviewDisplayMode = 'normal' | 'maximized' | 'minimized'

export type PreviewA11yPrefs = {
  zoomPercent: number
  highContrast: boolean
  reducedMotion: boolean
}

export type WorkspaceLayoutPrefs = {
  /** Preview pane width as % of workspace (20–80). */
  splitPercent: number
  /** Split % restored after exiting maximized preview. */
  splitPercentSaved?: number
  /** When true, control panel is on the left. */
  panelFirst: boolean
  tab: WorkspaceTab
  previewMode: PreviewDisplayMode
  previewA11y: PreviewA11yPrefs
}

const DEFAULT_A11Y: PreviewA11yPrefs = {
  zoomPercent: 100,
  highContrast: false,
  reducedMotion: false,
}

const STORAGE_KEY = 'espeezy-dev-hub-workspace-layout:v1'

const DEFAULT_PREFS: WorkspaceLayoutPrefs = {
  splitPercent: 68,
  panelFirst: false,
  tab: 'logs',
  previewMode: 'normal',
  previewA11y: DEFAULT_A11Y,
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
  const merged = {
    ...DEFAULT_PREFS,
    ...globalPrefs,
    ...appPrefs,
    previewA11y: {
      ...DEFAULT_A11Y,
      ...globalPrefs.previewA11y,
      ...appPrefs.previewA11y,
    },
    splitPercent: clamp(
      appPrefs.splitPercent ?? globalPrefs.splitPercent ?? DEFAULT_PREFS.splitPercent,
      22,
      78,
    ),
  }
  merged.previewA11y.zoomPercent = clamp(
    merged.previewA11y.zoomPercent,
    75,
    200,
  )
  return merged
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
        let next: WorkspaceLayoutPrefs = {
          ...prev,
          ...patch,
          ...(patch.splitPercent != null
            ? { splitPercent: clamp(patch.splitPercent, 22, 78) }
            : {}),
          ...(patch.previewA11y
            ? {
                previewA11y: {
                  ...prev.previewA11y,
                  ...patch.previewA11y,
                  ...(patch.previewA11y.zoomPercent != null
                    ? { zoomPercent: clamp(patch.previewA11y.zoomPercent, 75, 200) }
                    : {}),
                },
              }
            : {}),
        }

        if (patch.previewMode === 'maximized' && prev.previewMode !== 'maximized') {
          next = {
            ...next,
            splitPercentSaved: prev.splitPercent,
            previewMode: 'maximized',
          }
        } else if (patch.previewMode === 'normal' && prev.previewMode === 'maximized') {
          next = {
            ...next,
            previewMode: 'normal',
            splitPercent: prev.splitPercentSaved ?? prev.splitPercent,
            splitPercentSaved: undefined,
          }
        }

        persist(next)
        return next
      })
    },
    [persist],
  )

  const setPreviewMode = useCallback(
    (previewMode: PreviewDisplayMode) => setPrefs({ previewMode }),
    [setPrefs],
  )

  const setPreviewA11y = useCallback(
    (a11yPatch: Partial<PreviewA11yPrefs>) => {
      setPrefsState((prev) => {
        const next: WorkspaceLayoutPrefs = {
          ...prev,
          previewA11y: {
            ...prev.previewA11y,
            ...a11yPatch,
            ...(a11yPatch.zoomPercent != null
              ? { zoomPercent: clamp(a11yPatch.zoomPercent, 75, 200) }
              : {}),
          },
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

  return { prefs, setPrefs, setPreviewMode, setPreviewA11y, resetLayout, hydrated }
}
