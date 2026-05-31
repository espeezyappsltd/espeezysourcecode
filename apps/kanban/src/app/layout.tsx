import type { Metadata, Viewport } from 'next'
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
import TeamChatShell from '@/components/TeamChatShell'
import HelpTray from '@/components/HelpTray'
import ReferralCapture from '@/components/ReferralCapture'
import { PageGuideHost } from '@/components/guide/PageGuideHost'
import { MobilePageControlsProvider } from '@/components/mobile/MobilePageControlsContext'
import { getCachedLayoutSession } from '@/utils/auth-server'
import './prestige.css'
import './globals.css'
import './theme-ambient.css'
import './ui-panels.css'
import './mobile-shell.css'
import './forms-a11y.css'
import './central-premium.css'
import '@shared/theme-cycle.css'
import '@shared/espeezy-appearance.css'

export const metadata: Metadata = {
  title: 'Espeezy Kanban',
  description: 'Visual task management and structured collaboration for university teams, educators, and student groups.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
    other: [{ rel: 'mask-icon', url: '/icon.svg', color: '#10b981' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#10b981',
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getCachedLayoutSession()
  const layoutUser = user ? toLayoutUser(user) : null
  const needsTeamOnboarding = Boolean(user && !profile?.group_id)

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
                {needsTeamOnboarding ? (
                  <main className="main-content onboarding-shell">
                    <PageTransitionWrapper>{children}</PageTransitionWrapper>
                  </main>
                ) : (
                  <OnboardingWrapper profile={profile} user={layoutUser}>
                    <DashboardShell user={layoutUser}>{children}</DashboardShell>
                  </OnboardingWrapper>
                )}
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
          <MobilePageControlsProvider>
            <ReferralCapture />
            <Sidebar user={user} />
            <main className="main-content">
            <ConnectionAlertTray />
            <PageTransitionWrapper>{children}</PageTransitionWrapper>
            <PageGuideHost />
          </main>
          <GlobalAnnouncement />
          <HelpTray />
          <TeamChatShell />
          <BottomNav />
          </MobilePageControlsProvider>
        </PresenceProvider>
      </NotificationProvider>
    </div>
  )
}

