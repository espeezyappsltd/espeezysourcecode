import { createClient } from '@/lib/supabase/server'

export async function getStudiosLayoutTheme() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { initialTheme: undefined, userPlan: null as string | null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, theme_config, custom_bg_url')
      .eq('id', user.id)
      .maybeSingle()

    const themeConfig = profile?.theme_config as { palette?: string } | null

    return {
      initialTheme: {
        palette: themeConfig?.palette,
        bgUrl: profile?.custom_bg_url ?? null,
      },
      userPlan: profile?.subscription_plan ?? null,
    }
  } catch {
    return { initialTheme: undefined, userPlan: null as string | null }
  }
}
