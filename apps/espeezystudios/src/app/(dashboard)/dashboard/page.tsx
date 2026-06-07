import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  return (
    <div>
      <header className="studio-dashboard-header">
        <h1>Overview</h1>
        <p>Welcome back, {user.email}</p>
      </header>

      <div className="studio-dashboard-card">
        <h3>Quick Actions</h3>
        <p className="studio-dashboard-muted">Use the sidebar to navigate to apps and users management.</p>
      </div>
    </div>
  )
}
