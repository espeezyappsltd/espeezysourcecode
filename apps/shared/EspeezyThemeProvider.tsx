'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PALETTES, type EspeezyPalette } from './theme-palettes'
import {
  defaultPaletteForSystem,
  findPalette,
  persistPaletteName,
  readSyncedPaletteName,
  subscribePaletteSync,
  paletteToCssVars,
  ESPEEZY_BG_STORAGE_KEY,
  ESPEEZY_PALETTE_STORAGE_KEY,
} from './espeezy-theme-sync'
import { canAccessPaletteTier } from './theme-palette-access'

export type EspeezyThemeContextValue = {
  currentPalette: EspeezyPalette
  setPalette: (name: string) => Promise<void>
  customBg: string | null
  setCustomBg: (url: string | null) => Promise<void>
}

const EspeezyThemeContext = createContext<EspeezyThemeContextValue | undefined>(undefined)

export function useEspeezyTheme(): EspeezyThemeContextValue {
  const ctx = useContext(EspeezyThemeContext)
  if (!ctx) throw new Error('useEspeezyTheme must be used within EspeezyThemeProvider')
  return ctx
}

export type ThemeInitialValues = {
  palette?: string
  bgUrl?: string | null
}

export type EspeezyThemeProviderProps = {
  children: React.ReactNode
  initialTheme?: ThemeInitialValues
  userPlan?: string | null
  /** Extra class on theme root (e.g. games-theme-bridge) */
  rootClassName?: string
  /** Persist palette/bg to profile (Supabase) when user is signed in */
  onPersist?: (payload: { palette: string; customBg: string | null }) => Promise<void>
}

export function EspeezyThemeProvider({
  children,
  initialTheme,
  userPlan,
  rootClassName,
  onPersist,
}: EspeezyThemeProviderProps) {
  const [currentPalette, setCurrentPalette] = useState<EspeezyPalette>(() => {
    const fromProfile = findPalette(initialTheme?.palette)
    if (fromProfile) return fromProfile
    const synced = readSyncedPaletteName()
    if (synced) {
      const found = findPalette(synced)
      if (found) return found
    }
    return defaultPaletteForSystem()
  })

  const [customBg, setCustomBgState] = useState<string | null>(() => {
    if (initialTheme?.bgUrl) return initialTheme.bgUrl
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ESPEEZY_BG_STORAGE_KEY)
    }
    return null
  })

  useEffect(() => {
    if (initialTheme?.palette) {
      const p = findPalette(initialTheme.palette)
      if (p) setCurrentPalette(p)
    }
    if (initialTheme?.bgUrl !== undefined) setCustomBgState(initialTheme.bgUrl)
  }, [initialTheme?.palette, initialTheme?.bgUrl])

  useEffect(() => {
    return subscribePaletteSync((name) => {
      const p = findPalette(name)
      if (p) setCurrentPalette(p)
    })
  }, [])

  const setPalette = useCallback(
    async (name: string) => {
      const palette = findPalette(name)
      if (!palette) return

      const tier = palette.tier ?? 'free'
      if (!canAccessPaletteTier(userPlan, tier)) {
        throw new Error(tier === 'premium' ? 'PREMIUM_LOCKED' : 'PRO_LOCKED')
      }

      setCurrentPalette(palette)
      persistPaletteName(name)
      await onPersist?.({ palette: name, customBg })
    },
    [userPlan, onPersist, customBg],
  )

  const setCustomBg = useCallback(
    async (url: string | null) => {
      setCustomBgState(url)
      if (typeof window !== 'undefined') {
        if (url) localStorage.setItem(ESPEEZY_BG_STORAGE_KEY, url)
        else localStorage.removeItem(ESPEEZY_BG_STORAGE_KEY)
      }
      await onPersist?.({ palette: currentPalette.name, customBg: url })
    },
    [onPersist, currentPalette.name],
  )

  const cssBlock = useMemo(() => paletteToCssVars(currentPalette.colors), [currentPalette])

  return (
    <EspeezyThemeContext.Provider value={{ currentPalette, setPalette, customBg, setCustomBg }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root {\n${cssBlock}\n}`,
        }}
      />
      <div
        className={`theme-wrapper espeezy-theme-root${customBg ? ' has-custom-bg' : ''}${rootClassName ? ` ${rootClassName}` : ''}`}
        data-palette={currentPalette.name}
        data-theme-tier={currentPalette.tier ?? 'free'}
        style={
          customBg
            ? {
                backgroundImage: `url(${customBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                minHeight: '100vh',
              }
            : undefined
        }
      >
        {children}
      </div>
    </EspeezyThemeContext.Provider>
  )
}
