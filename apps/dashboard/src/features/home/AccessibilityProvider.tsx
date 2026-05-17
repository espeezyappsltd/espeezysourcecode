'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type A11ySettings = {
  fontScale: number
  highContrast: boolean
  reducedMotion: boolean
  underlineLinks: boolean
}

const STORAGE_KEY = 'espeezy-kanban-a11y:v1'

const DEFAULT: A11ySettings = {
  fontScale: 100,
  highContrast: false,
  reducedMotion: false,
  underlineLinks: false,
}

type ContextValue = A11ySettings & {
  setFontScale: (scale: number) => void
  bumpFontScale: (delta: number) => void
  setHighContrast: (v: boolean) => void
  setReducedMotion: (v: boolean) => void
  setUnderlineLinks: (v: boolean) => void
  resetA11y: () => void
}

const A11yContext = createContext<ContextValue | null>(null)

function clampScale(n: number) {
  return Math.min(150, Math.max(75, Math.round(n)))
}

function readStored(): A11ySettings {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw) as Partial<A11ySettings>
    return {
      fontScale: clampScale(parsed.fontScale ?? DEFAULT.fontScale),
      highContrast: !!parsed.highContrast,
      reducedMotion: !!parsed.reducedMotion,
      underlineLinks: !!parsed.underlineLinks,
    }
  } catch {
    return DEFAULT
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSettings(readStored())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    const root = document.documentElement
    root.style.setProperty('--kanban-font-scale', String(settings.fontScale / 100))
    root.dataset.highContrast = settings.highContrast ? 'true' : 'false'
    root.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false'
    root.dataset.underlineLinks = settings.underlineLinks ? 'true' : 'false'
  }, [settings, hydrated])

  const patch = useCallback((partial: Partial<A11ySettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  const value = useMemo<ContextValue>(
    () => ({
      ...settings,
      setFontScale: (scale) => patch({ fontScale: clampScale(scale) }),
      bumpFontScale: (delta) =>
        setSettings((prev) => ({ ...prev, fontScale: clampScale(prev.fontScale + delta) })),
      setHighContrast: (highContrast) => patch({ highContrast }),
      setReducedMotion: (reducedMotion) => patch({ reducedMotion }),
      setUnderlineLinks: (underlineLinks) => patch({ underlineLinks }),
      resetA11y: () => setSettings(DEFAULT),
    }),
    [settings, patch],
  )

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>
}

export function useA11y() {
  const ctx = useContext(A11yContext)
  if (!ctx) throw new Error('useA11y must be used within AccessibilityProvider')
  return ctx
}
