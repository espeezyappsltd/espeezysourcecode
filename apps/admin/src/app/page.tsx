import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { buildAdminLoginUrl } from '@/lib/app-url'
import { createServerSupabaseClient } from '@/lib/db'
import { getAdminMemberByUserId } from '@/utils/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * panel.espeezy.com/ — main entry: staff login or admin console.
 * Legacy password dashboard removed; use /login (OTP) and /admin (console).
 */
export default async function PanelRootPage() {
  const headersList = await headers()
  const db = await createServerSupabaseClient()
  const {
    data: { user },
  } = await db.auth.getUser().catch(() => ({ data: { user: null } }))

  if (!user) {
    redirect('/login')
  }

  const member = await getAdminMemberByUserId(user.id)
  if (!member) {
    redirect(buildAdminLoginUrl({ headers: headersList }, { error: 'not_staff' }))
  }

  redirect('/admin')
}
