import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProfileProvider } from '@/context/ProfileContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider } from '@/components/NotificationProvider'
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider'
import AdminSidebar from '@/components/AdminSidebar'
import type { Profile } from '@/types/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Ensure only admins can access this subtree
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
        <ProfileProvider userId={user.id} initialProfile={profile as Profile | null}>
           <NotificationProvider>
             <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
               <AdminSidebar adminEmail={user.email ?? ''} adminName={profile?.full_name ?? 'Admin'} />
               <main style={{ flex: 1, overflowY: 'auto' }}>
                 {children}
               </main>
             </div>
           </NotificationProvider>
        </ProfileProvider>
      </GlobalLoadingProvider>
    </ThemeProvider>
  )
}
