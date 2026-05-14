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
  const { data: { user } } = await db.auth.getUser()

  // For routes like login/auth, we don't want the dashboard layout
  // However, Next.js root layout applies to all.
  // We can handle the dashboard-specific components conditionally or move them to a separate layout if needed.
  // But the user said "host the main dashboard".

  if (!user) {
    // If we're not on the login page, redirect
    // But since this is a server component layout, we need to be careful.
    // Usually auth is handled in middleware.
  }

  const profile = user ? (await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()).data : null

  const initialTheme = {
    palette: profile?.theme_config?.palette || 'Google Light',
    bgUrl: profile?.custom_bg_url
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <ThemeProvider initialTheme={initialTheme} userPlan={profile?.subscription_plan}>
          <GlobalLoadingProvider>
            {user ? (
              <ProfileProvider userId={user.id} initialProfile={profile as import('@/types/auth').Profile | null}>
                <OnboardingWrapper profile={profile as { full_name?: string; avatar_url?: string } | null} user={user}>
                  <div className="dashboard-layout">
                    <PresenceProvider user={user}>
                      <NotificationProvider>
                        <Sidebar user={user} />

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
            ) : (
              <main>{children}</main>
            )}
          </GlobalLoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
