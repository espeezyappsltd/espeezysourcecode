import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import { PresenceProvider } from '../../components/PresenceProvider'
import { NotificationProvider } from '../../components/NotificationProvider'
import { ThemeProvider } from '../../context/ThemeContext'
import { GlobalLoadingProvider } from '../../components/GlobalLoadingProvider'
import { ProfileProvider } from '../../context/ProfileContext'
import ConnectionAlertTray from '../../components/ConnectionAlertTray'
import { SpotifyProvider } from '../../context/SpotifyContext'
import SpotifyMiniPlayer from '../../components/SpotifyMiniPlayer'
import GlobalAnnouncement from '../../components/GlobalAnnouncement'
import SupportChat from '../../components/SupportChat'

export const dynamic = 'force-dynamic'

export default async function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const initialTheme = {
    palette: profile?.theme_config?.palette || 'Google Light',
    bgUrl: profile?.custom_bg_url
  }

  return (
    <ThemeProvider initialTheme={initialTheme} userPlan={profile?.subscription_plan}>
      <GlobalLoadingProvider>
        <ProfileProvider userId={user.id} initialProfile={profile as import('@/types/auth').Profile | null}>
          <div className="dashboard-layout">
            <PresenceProvider user={user}>
              <SpotifyProvider>
                <NotificationProvider>
                  <Sidebar user={user} />
                  
                  <main className="main-content">
                    <ConnectionAlertTray />
                    {children}
                  </main>

                  <SpotifyMiniPlayer />
                  <GlobalAnnouncement />
                  <SupportChat />
                  <BottomNav />
                </NotificationProvider>
              </SpotifyProvider>
            </PresenceProvider>
          </div>
        </ProfileProvider>
      </GlobalLoadingProvider>
    </ThemeProvider>
  )
}
