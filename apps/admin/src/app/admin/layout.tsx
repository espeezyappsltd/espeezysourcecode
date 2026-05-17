import { createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { NotificationProvider } from '@/components/NotificationProvider'
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider'
import AdminLiveChatWidget from '@/components/AdminLiveChatWidget'
import { AdminConsoleShell } from '@/components/console/AdminConsoleShell'
import { AdminOnboardingProvider } from '@/context/AdminOnboardingContext'
import { getAdminMemberByUserId } from '@/utils/admin-auth'
import { canAccessAdminRoute } from '@/lib/admin-rbac'
import '@/app/admin-console.css'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const pathname = headersList.get('x-pathname') || '/admin'
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
  if (!member) redirect(`${loginBase}/login?error=not_staff`)

  if (!canAccessAdminRoute(member.admin_role, pathname)) {
    redirect('/admin')
  }

  return (
    <GlobalLoadingProvider>
      <NotificationProvider>
        <AdminOnboardingProvider>
          <AdminConsoleShell
            adminRole={member.admin_role}
            username={member.username}
            displayName={member.display_name ?? member.username}
            email={member.email}
          >
            {children}
          </AdminConsoleShell>
          <AdminLiveChatWidget appScope="admin" />
        </AdminOnboardingProvider>
      </NotificationProvider>
    </GlobalLoadingProvider>
  )
}
