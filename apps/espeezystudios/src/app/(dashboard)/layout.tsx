import { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, AppWindow, Users } from 'lucide-react'
import '@/components/studio-dashboard.css' // We will create this

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="studio-dashboard-layout">
      <aside className="studio-dashboard-sidebar">
        <div className="studio-dashboard-sidebar-header">
          <h2>StudioHub</h2>
        </div>
        <nav className="studio-dashboard-nav">
          <Link href="/dashboard" className="studio-dashboard-nav-link">
            <LayoutDashboard size={18} /> Overview
          </Link>
          <Link href="/dashboard/apps" className="studio-dashboard-nav-link">
            <AppWindow size={18} /> Apps
          </Link>
          <Link href="/dashboard/users" className="studio-dashboard-nav-link">
            <Users size={18} /> Users
          </Link>
        </nav>
      </aside>
      <main className="studio-dashboard-main">
        {children}
      </main>
    </div>
  )
}
