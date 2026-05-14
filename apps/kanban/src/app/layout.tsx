import { createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { PresenceProvider } from '@/components/PresenceProvider'
import { NotificationProvider } from '@/components/NotificationProvider'
import { ThemeProvider } from '@/context/ThemeContext'

import OnboardingWrapper from '@/components/OnboardingWrapper'
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider'
import { ProfileProvider } from '@/context/ProfileContext'
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

  const profile = user.id !== '00000000-0000-0000-0000-000000000000' ? (await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()).data : {
      id: user.id,
      full_name: 'Test User',
      subscription_plan: 'pro',
      theme_config: { palette: 'Google Light' }
    }

  const initialTheme = {
    palette: profile?.theme_config?.palette || 'Google Light',
    bgUrl: profile?.custom_bg_url
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <ThemeProvider initialTheme={initialTheme} userPlan={profile?.subscription_plan}>
          <GlobalLoadingProvider>
            <ProfileProvider userId={user.id} initialProfile={profile as any}>
              <OnboardingWrapper profile={profile as any} user={user as any}>
                <div className="dashboard-layout">
                  <PresenceProvider user={user as any}>
                    <NotificationProvider>
                      <Sidebar user={user as any} />

                      <main className="main-content">
                        <ConnectionAlertTray />
                        {children}
                      </main>

                      <GlobalAnnouncement />
                      <SupportChat />
                      <BottomNav />
                    </NotificationProvider>
                  </PresenceProvider>
                </div>
              </OnboardingWrapper>
            </ProfileProvider>
          </GlobalLoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
