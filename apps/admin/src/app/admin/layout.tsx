import { createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { ProfileProvider } from '@/context/ProfileContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider } from '@/components/NotificationProvider'
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider'
import AdminSidebar from '@/components/AdminSidebar'
import AdminLiveChatWidget from '@/components/AdminLiveChatWidget'
import { getAdminMemberByUserId } from '@/utils/admin-auth'
import type { Profile } from '@/types/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const loginBase = host.includes('localhost')
    ? `${protocol}://localhost:3004`
    : host.startsWith('admin.')
      ? `${protocol}://${host}`
      : `${protocol}://admin.${host.split(':')[0]}`

  const db = await createServerSupabaseClient()
  const {
    data: { user },
  } = await db.auth.getUser().catch(() => ({ data: { user: null } }))

  if (!user) {
    redirect(`${loginBase}/login?redirect=${encodeURIComponent(`${protocol}://${host}/admin`)}`)
  }

  const member = await getAdminMemberByUserId(user.id)
  if (!member) {
    redirect(`${loginBase}/login?error=not_staff`)
  }

  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single()

  const initialTheme = {
    palette: profile?.theme_config?.palette || 'Google Light',
    bgUrl: profile?.custom_bg_url,
  }

  return (
    <ThemeProvider initialTheme={initialTheme} userPlan={profile?.subscription_plan}>
      <GlobalLoadingProvider>
        <ProfileProvider userId={user.id} initialProfile={profile as Profile | null}>
          <NotificationProvider>
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
              <AdminSidebar
                adminEmail={member.email}
                adminName={member.display_name ?? profile?.full_name ?? member.username}
                adminRole={member.admin_role}
                username={member.username}
              />
              <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>{children}</main>
            </div>
            <AdminLiveChatWidget appScope="admin" />
          </NotificationProvider>
        </ProfileProvider>
      </GlobalLoadingProvider>
    </ThemeProvider>
  )
}
