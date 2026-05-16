import { createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProfileProvider } from '@/context/ProfileContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider } from '@/components/NotificationProvider'
import type { Profile } from '@/types/auth'
export const dynamic = 'force-dynamic'

export default async function TerminalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()

  // Terminal is institutional - requires auth even for the gateway initialization
  if (!user) {
    redirect('/login?redirect=/terminal/orbit-delta-prime/gateway')
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Secure terminal nodes require administrative clearance
  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  const initialTheme = {
    palette: profile?.theme_config?.palette || 'Google Light',
    bgUrl: profile?.custom_bg_url
  }

  return (
    <ThemeProvider initialTheme={initialTheme} userPlan={profile?.subscription_plan}>
      <ProfileProvider userId={user.id} initialProfile={profile as Profile}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ProfileProvider>
    </ThemeProvider>
  )
}
