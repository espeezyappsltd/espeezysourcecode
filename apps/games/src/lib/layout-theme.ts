import { createClient } from '@/lib/supabase/server'

export async function getGamesLayoutTheme() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, initialTheme: undefined, userPlan: null as string | null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, theme_config, custom_bg_url')
    .eq('id', user.id)
    .maybeSingle()

  const themeConfig = profile?.theme_config as { palette?: string } | null

  return {
    user,
    initialTheme: {
      palette: themeConfig?.palette,
      bgUrl: profile?.custom_bg_url ?? null,
    },
    userPlan: profile?.subscription_plan ?? null,
  }
}
