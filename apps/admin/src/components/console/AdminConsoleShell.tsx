'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ADMIN_NAV_ITEMS, hasAdminPermission, type AdminStaffRole } from '@/lib/admin-rbac'
import { AdminOnboardingBanner } from './AdminOnboardingBanner'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'

type Props = {
  children: React.ReactNode
  adminRole: AdminStaffRole
  username: string
  displayName: string
  email: string
}

function titleForPath(pathname: string): string {
  const item = ADMIN_NAV_ITEMS.find(
    (n) => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)),
  )
  return item?.label ?? 'Admin'
}

export function AdminConsoleShell({ children, adminRole, username, displayName, email }: Props) {
  const pathname = usePathname() ?? '/admin'
  const pageTitle = titleForPath(pathname)
  const { setPageHint } = useAdminOnboarding()

  const navItems = ADMIN_NAV_ITEMS.filter((item) => hasAdminPermission(adminRole, item.permission))

  return (
    <div className="admin-console-root">
      <div className="admin-console-shell">
        <aside className="admin-console-nav" aria-label="Admin navigation">
          <div className="admin-console-nav-brand">
            Espeezy
            <strong>Admin console</strong>
          </div>
          <ul className="admin-console-nav-list">
            {navItems.map((item) => {
              const active =
                item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`admin-console-nav-link ${active ? 'active' : ''}`}
                    onClick={() => setPageHint(item.description ?? null)}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="admin-console-nav-foot">
            <div style={{ fontWeight: 500, color: '#202124' }}>{displayName}</div>
            @{username} · {adminRole}
            <div style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}>{email}</div>
          </div>
        </aside>

        <div className="admin-console-main">
          <header className="admin-console-topbar">
            <nav className="admin-console-breadcrumb" aria-label="Breadcrumb">
              Admin console / <strong>{pageTitle}</strong>
            </nav>
            <Link href="/login" className="admin-console-btn" style={{ fontSize: '0.8rem' }}>
              Sign out
            </Link>
          </header>
          <div className="admin-console-content">
            <AdminOnboardingBanner />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
