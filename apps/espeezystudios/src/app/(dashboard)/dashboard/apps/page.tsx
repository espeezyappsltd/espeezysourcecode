import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlatformAppsPanel from '@/components/dashboard/PlatformAppsPanel'

export default async function DashboardAppsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard/apps')
  }

  return (
    <div>
      <header className="studio-dashboard-header">
        <h1>Apps Management</h1>
        <p>Create, update, and manage the platform application catalog.</p>
      </header>
      <PlatformAppsPanel />
    </div>
  )
}
