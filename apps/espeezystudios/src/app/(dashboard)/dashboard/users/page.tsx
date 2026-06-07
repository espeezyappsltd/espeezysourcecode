import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementPanel from '@/components/dashboard/UserManagementPanel'

export default async function DashboardUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard/users')
  }

  return (
    <div>
      <header className="studio-dashboard-header">
        <h1>User Management</h1>
        <p>View and manage platform user profiles.</p>
      </header>
      <UserManagementPanel />
    </div>
  )
}
