'use client'

import { Moon, Sun } from 'lucide-react'
import { useEspeezyTheme } from './EspeezyThemeProvider'
import {
  cycleQuickPalette,
  isDarkPaletteName,
  THEME_QUICK_CYCLE,
  type QuickCyclePaletteName,
} from './espeezy-theme-sync'

type ThemeCycleButtonProps = {
  className?: string
  labelClassName?: string
  showLabel?: boolean
  onLocked?: (tier: 'pro' | 'premium') => void
}

/**
 * Sidebar/footer control — cycles Google Light → Deep Oceanic → Cyberpunk (synced across apps).
 */
export function ThemeCycleButton({
  className = '',
  labelClassName = 'theme-cycle-btn__label',
  showLabel = true,
  onLocked,
}: ThemeCycleButtonProps) {
  const { currentPalette, setPalette } = useEspeezyTheme()
  const isDark = isDarkPaletteName(currentPalette.name)

  const toggle = async () => {
    const next = cycleQuickPalette(currentPalette.name)
    try {
      await setPalette(next)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'PREMIUM_LOCKED' || msg === 'PRO_LOCKED') {
        onLocked?.(msg === 'PREMIUM_LOCKED' ? 'premium' : 'pro')
      }
    }
  }

  const nextName = cycleQuickPalette(currentPalette.name)

  return (
    <button
      type="button"
      className={`theme-cycle-btn ${className}`.trim()}
      onClick={() => void toggle()}
      title={`Theme: ${currentPalette.name}. Next: ${nextName}.`}
      aria-label={`Change theme. Current: ${currentPalette.name}. Cycles ${THEME_QUICK_CYCLE.join(', ')}.`}
    >
      {isDark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
      {showLabel && <span className={labelClassName}>Theme</span>}
    </button>
  )
}
