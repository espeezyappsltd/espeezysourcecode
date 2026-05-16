import { createServerSupabaseClient } from '@/lib/db'
import Sidebar from '@/components/Sidebar'
import type { Profile } from '@/types/auth'
import { createMockProfile, isMockUserId } from '@/utils/mock-profile'
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
import './prestige.css'
import './globals.css'

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const db = await createServerSupabaseClient()
  const { data: { user: realUser } } = await db.auth.getUser()

  // MOCK USER FOR TESTING
  const user = realUser || {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }

  const profile: Profile | null = !isMockUserId(user.id)
    ? ((await db.from('profiles').select('*').eq('id', user.id).single()).data as Profile | null)
    : createMockProfile(user.id)

  const layoutUser = toLayoutUser(user)

  const initialTheme = {
    palette: profile?.theme_config?.palette || 'Google Light',
    bgUrl: profile?.custom_bg_url
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <ThemeProvider initialTheme={initialTheme} userPlan={profile?.subscription_plan}>
          <KanbanProviders>
            <ProfileProvider userId={user.id} initialProfile={profile}>
              <OnboardingWrapper profile={profile} user={layoutUser}>
                <div className="dashboard-layout">
                  <NotificationProvider>
                    <PresenceProvider user={layoutUser}>
                      <Sidebar user={layoutUser} />

                      <main className="main-content">
                        <ConnectionAlertTray />
                        <PageTransitionWrapper>
                          {children}
                        </PageTransitionWrapper>
                      </main>

                      <GlobalAnnouncement />
                      <SupportChat />
                      <BottomNav />
                    </PresenceProvider>
                  </NotificationProvider>
                </div>
              </OnboardingWrapper>
            </ProfileProvider>
          </KanbanProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
