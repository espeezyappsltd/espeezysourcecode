import { createServerSupabaseClient } from '@/lib/db'
import Sidebar from '@/components/Sidebar'
import type { Profile } from '@/types/auth'
import { toLayoutUser } from '@/utils/layout-user'
import BottomNav from '@/components/BottomNav'
import { PresenceProvider } from '@/components/PresenceProvider'
import { NotificationProvider } from '@/components/NotificationProvider'
import { ThemeProvider } from '@/context/ThemeContext'
import OnboardingWrapper from '@/components/OnboardingWrapper'
import { KanbanProviders } from '@/components/KanbanProviders'
import { ProfileProvider } from '@/context/ProfileContext'
import PageTransitionWrapper from '@shared/PageTransitionWrapper'
import ConnectionAlertTray from '@/components/ConnectionAlertTray'
import GlobalAnnouncement from '@/components/GlobalAnnouncement'
import SupportChat from '@/components/SupportChat'
import { getCachedUserProfile } from '@/utils/auth-server'
import './prestige.css'
import './globals.css'

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()

  const profile: Profile | null = user ? await getCachedUserProfile(user.id) : null
  const layoutUser = user ? toLayoutUser(user) : null

  const initialTheme = {
    palette: profile?.theme_config?.palette || 'Google Light',
    bgUrl: profile?.custom_bg_url,
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <ThemeProvider initialTheme={initialTheme} userPlan={profile?.subscription_plan}>
          <KanbanProviders>
            {user && layoutUser ? (
              <ProfileProvider userId={user.id} initialProfile={profile}>
                <OnboardingWrapper profile={profile} user={layoutUser}>
                  <DashboardShell user={layoutUser}>{children}</DashboardShell>
                </OnboardingWrapper>
              </ProfileProvider>
            ) : (
              children
            )}
          </KanbanProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}

function DashboardShell({
  user,
  children,
}: {
  user: ReturnType<typeof toLayoutUser>
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-layout">
      <NotificationProvider>
        <PresenceProvider user={user}>
          <Sidebar user={user} />
          <main className="main-content">
            <ConnectionAlertTray />
            <PageTransitionWrapper>{children}</PageTransitionWrapper>
          </main>
          <GlobalAnnouncement />
          <SupportChat />
          <BottomNav />
        </PresenceProvider>
      </NotificationProvider>
    </div>
  )
}

