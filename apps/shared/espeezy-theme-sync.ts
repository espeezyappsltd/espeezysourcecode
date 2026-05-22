import { PALETTES, type EspeezyPalette } from './theme-palettes'

export const ESPEEZY_PALETTE_STORAGE_KEY = 'espeezy_palette'
export const ESPEEZY_BG_STORAGE_KEY = 'espeezy_bg'
export const ESPEEZY_THEME_COOKIE = 'espeezy_palette'
export const ESPEEZY_THEME_BROADCAST = 'espeezy-theme-sync'

/** Sidebar quick-cycle palettes (same on Kanban & Games). */
export const THEME_QUICK_CYCLE = ['Google Light', 'Deep Oceanic', 'Cyberpunk'] as const

export type QuickCyclePaletteName = (typeof THEME_QUICK_CYCLE)[number]

const DARK_PALETTES = new Set([
  'Deep Oceanic',
  'Cyberpunk',
  'Emerald Pro',
  'Midnight Indigo',
  'Gold Luxury',
  'Executive Success',
  'Solar Flare',
  'Crimson Peak',
  'Obsidian Success',
  'Obsidian Gold',
  'Neon Overdrive',
  'Midnight Platinum',
])

export function findPalette(name: string | null | undefined): EspeezyPalette | undefined {
  if (!name) return undefined
  return PALETTES.find((p) => p.name === name)
}

export function resolveCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const host = window.location.hostname
  if (host === 'espeezy.com' || host.endsWith('.espeezy.com')) return '.espeezy.com'
  return undefined
}

export function readPaletteFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${ESPEEZY_THEME_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function writePaletteCookie(name: string): void {
  if (typeof document === 'undefined') return
  const domain = resolveCookieDomain()
  const maxAge = 60 * 60 * 24 * 400
  let cookie = `${ESPEEZY_THEME_COOKIE}=${encodeURIComponent(name)}; path=/; max-age=${maxAge}; SameSite=Lax`
  if (domain) cookie += `; domain=${domain}`
  document.cookie = cookie
}

export function readSyncedPaletteName(): string | null {
  if (typeof window === 'undefined') return null
  const fromStorage = localStorage.getItem(ESPEEZY_PALETTE_STORAGE_KEY)
  if (fromStorage && findPalette(fromStorage)) return fromStorage
  const fromCookie = readPaletteFromCookie()
  if (fromCookie && findPalette(fromCookie)) return fromCookie
  return null
}

export function persistPaletteName(name: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ESPEEZY_PALETTE_STORAGE_KEY, name)
  writePaletteCookie(name)
  try {
    const channel = new BroadcastChannel(ESPEEZY_THEME_BROADCAST)
    channel.postMessage({ type: 'palette', name })
    channel.close()
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export function subscribePaletteSync(onPalette: (name: string) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const onStorage = (e: StorageEvent) => {
    if (e.key === ESPEEZY_PALETTE_STORAGE_KEY && e.newValue && findPalette(e.newValue)) {
      onPalette(e.newValue)
    }
  }

  let channel: BroadcastChannel | null = null
  const onMessage = (e: MessageEvent<{ type?: string; name?: string }>) => {
    if (e.data?.type === 'palette' && e.data.name && findPalette(e.data.name)) {
      onPalette(e.data.name)
    }
  }

  window.addEventListener('storage', onStorage)
  try {
    channel = new BroadcastChannel(ESPEEZY_THEME_BROADCAST)
    channel.addEventListener('message', onMessage)
  } catch {
    channel = null
  }

  return () => {
    window.removeEventListener('storage', onStorage)
    channel?.removeEventListener('message', onMessage)
    channel?.close()
  }
}

export function cycleQuickPalette(currentName: string): QuickCyclePaletteName {
  const idx = THEME_QUICK_CYCLE.indexOf(currentName as QuickCyclePaletteName)
  const safe = idx === -1 ? 0 : idx
  return THEME_QUICK_CYCLE[(safe + 1) % THEME_QUICK_CYCLE.length]
}

export function isDarkPaletteName(name: string): boolean {
  return DARK_PALETTES.has(name)
}

export function paletteToCssVars(colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([key, val]) => `${key}: ${val};`)
    .join('\n')
}

export function defaultPaletteForSystem(): EspeezyPalette {
  if (typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return findPalette(prefersDark ? 'Deep Oceanic' : 'Google Light') ?? PALETTES[0]
  }
  return PALETTES[0]
}
