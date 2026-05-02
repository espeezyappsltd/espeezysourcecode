import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProfileProvider } from '@/context/ProfileContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider } from '@/components/NotificationProvider'
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider'

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
    redirect('/dashboard')
  }

  const initialTheme = {
    palette: profile?.theme_config?.palette || 'Google Light',
    bgUrl: profile?.custom_bg_url
  }

  return (
    <ThemeProvider initialTheme={initialTheme} userPlan={profile?.subscription_plan}>
      <GlobalLoadingProvider>
        <ProfileProvider userId={user.id} initialProfile={profile as any}>
           <NotificationProvider>
             {children}
           </NotificationProvider>
        </ProfileProvider>
      </GlobalLoadingProvider>
    </ThemeProvider>
  )
}
