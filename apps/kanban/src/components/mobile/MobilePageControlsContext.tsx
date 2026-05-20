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

export type MobileSearchControl = {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onClear?: () => void
}

export type MobileFilterPanel = {
  id: string
  label: string
  content: ReactNode
}

export type MobileHeaderAction = {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  variant?: 'primary' | 'ghost' | 'fab'
  badge?: number | string
}

export type MobilePageControlsConfig = {
  search?: MobileSearchControl | null
  filterPanels?: MobileFilterPanel[]
  actions?: MobileHeaderAction[]
}

type MobilePageControlsContextValue = {
  controls: MobilePageControlsConfig | null
  setControls: (config: MobilePageControlsConfig | null) => void
}

const MobilePageControlsContext = createContext<MobilePageControlsContextValue | null>(null)

export function MobilePageControlsProvider({ children }: { children: ReactNode }) {
  const [controls, setControlsState] = useState<MobilePageControlsConfig | null>(null)

  const setControls = useCallback((config: MobilePageControlsConfig | null) => {
    setControlsState(config)
  }, [])

  const value = useMemo(() => ({ controls, setControls }), [controls, setControls])

  return (
    <MobilePageControlsContext.Provider value={value}>
      {children}
    </MobilePageControlsContext.Provider>
  )
}

export function useMobilePageControlsContext() {
  return useContext(MobilePageControlsContext)
}

/** Register page-level search / filters / actions for the mobile top bar. */
export function useMobilePageControls(config: MobilePageControlsConfig | null) {
  const setControls = useMobilePageControlsContext()?.setControls

  useEffect(() => {
    setControls?.(config)
  })

  useEffect(() => {
    return () => setControls?.(null)
  }, [setControls])
}
