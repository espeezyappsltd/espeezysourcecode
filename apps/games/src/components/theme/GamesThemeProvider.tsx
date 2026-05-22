'use client'

import { EspeezyThemeProvider, useEspeezyTheme, type ThemeInitialValues } from '@shared/EspeezyThemeProvider'
import { getSupabaseClient } from '@/lib/supabase-client'

export { PALETTES } from '@shared/theme-palettes'
export const useTheme = useEspeezyTheme

export function GamesThemeProvider({
  children,
  initialTheme,
  userPlan,
}: {
  children: React.ReactNode
  initialTheme?: ThemeInitialValues
  userPlan?: string | null
}) {
  return (
    <EspeezyThemeProvider
      rootClassName="games-theme-bridge"
      initialTheme={initialTheme}
      userPlan={userPlan}
      onPersist={async ({ palette, customBg }) => {
        const supabase = getSupabaseClient()
        if (!supabase) return
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        await supabase
          .from('profiles')
          .update({
            theme_config: { palette },
            custom_bg_url: customBg,
          })
          .eq('id', user.id)
      }}
    >
      {children}
    </EspeezyThemeProvider>
  )
}
