import { createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import { PresenceProvider } from '../../components/PresenceProvider'
import { NotificationProvider } from '../../components/NotificationProvider'
import { ThemeProvider } from '../../context/ThemeContext'
import { GlobalLoadingProvider } from '../../components/GlobalLoadingProvider'
import { ProfileProvider } from '../../context/ProfileContext'
import ConnectionAlertTray from '../../components/ConnectionAlertTray'
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

  // Removing forced redirect to allow for a public academic feed
  // if (!user) {
  //   redirect('/login')
  // }

  return <>{children}</>
}
