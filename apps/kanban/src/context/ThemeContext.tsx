'use client'

import { EspeezyThemeProvider, useEspeezyTheme, type ThemeInitialValues } from '@shared/EspeezyThemeProvider'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import { logActivity } from '@/utils/logging'
import type { ThemeContextType } from '@/types/ui'

export { PALETTES } from '@shared/theme-palettes'
export type { EspeezyPalette } from '@shared/theme-palettes'

export const useTheme = (): ThemeContextType => {
  const ctx = useEspeezyTheme()
  return {
    currentPalette: ctx.currentPalette,
    setPalette: ctx.setPalette,
    customBg: ctx.customBg,
    setCustomBg: ctx.setCustomBg,
  }
}

export type { ThemeInitialValues }

export const ThemeProvider = ({
  children,
  initialTheme,
  userPlan,
}: {
  children: React.ReactNode
  initialTheme?: ThemeInitialValues
  userPlan?: string | null
}) => {
  const db = createBrowserSupabaseClient()

  return (
    <EspeezyThemeProvider
      initialTheme={initialTheme}
      userPlan={userPlan}
      onPersist={async ({ palette, customBg }) => {
        const {
          data: { user },
        } = await db.auth.getUser()
        if (!user) return

        await db
          .from('profiles')
          .update({
            theme_config: { palette },
            custom_bg_url: customBg,
          })
          .eq('id', user.id)

        const { data: profile } = await db.from('profiles').select('group_id').eq('id', user.id).single()
        logActivity(user.id, profile?.group_id, 'theme_changed', `Changed palette to ${palette}`)
      }}
    >
      {children}
    </EspeezyThemeProvider>
  )
}
