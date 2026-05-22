'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ADMIN_NAV_ITEMS, hasAdminPermission, type AdminStaffRole } from '@/lib/admin-rbac'
import { AdminOnboardingBanner } from './AdminOnboardingBanner'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { useIsMobileShell } from '@/hooks/useMobileShell'

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
  const isMobile = useIsMobileShell()
  const [navOpen, setNavOpen] = useState(false)

  const navItems = ADMIN_NAV_ITEMS.filter((item) => hasAdminPermission(adminRole, item.permission))

  const closeNav = useCallback(() => setNavOpen(false), [])

  useEffect(() => {
    closeNav()
  }, [pathname, closeNav])

  useEffect(() => {
    if (!isMobile || !navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNav()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobile, navOpen, closeNav])

  useEffect(() => {
    if (!isMobile) {
      document.body.classList.remove('body-lock')
      return
    }
    if (navOpen) document.body.classList.add('body-lock')
    else document.body.classList.remove('body-lock')
    return () => document.body.classList.remove('body-lock')
  }, [isMobile, navOpen])

  return (
    <div className="admin-console-root">
      {isMobile && navOpen && (
        <button
          type="button"
          className="admin-console-backdrop"
          aria-label="Close navigation"
          onClick={closeNav}
        />
      )}

      {isMobile && (
        <header className="admin-console-mobile-bar" aria-label="Admin mobile header">
          <button
            type="button"
            className="admin-console-menu-btn"
            aria-expanded={navOpen}
            aria-controls="admin-console-nav"
            onClick={() => setNavOpen((v) => !v)}
          >
            {navOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            <span className="admin-console-sr-only">{navOpen ? 'Close menu' : 'Open menu'}</span>
          </button>
          <div className="admin-console-mobile-bar-title">
            <span className="admin-console-mobile-bar-eyebrow">Admin console</span>
            <strong>{pageTitle}</strong>
          </div>
          <Link href="/login" className="admin-console-mobile-signout" onClick={closeNav}>
            Sign out
          </Link>
        </header>
      )}

      <div className={`admin-console-shell ${isMobile ? 'is-mobile' : ''}`}>
        <aside
          id="admin-console-nav"
          className={`admin-console-nav ${navOpen ? 'is-open' : ''}`}
          aria-label="Admin navigation"
          aria-hidden={isMobile && !navOpen ? true : undefined}
        >
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
                    onClick={() => {
                      setPageHint(item.description ?? null)
                      closeNav()
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="admin-console-nav-foot">
            <div className="admin-console-nav-foot-name">{displayName}</div>
            <div>
              @{username} · {adminRole}
            </div>
            <div className="admin-console-nav-foot-email">{email}</div>
          </div>
        </aside>

        <div className="admin-console-main">
          <header className="admin-console-topbar" aria-label="Admin top bar">
            <nav className="admin-console-breadcrumb" aria-label="Breadcrumb">
              Admin console / <strong>{pageTitle}</strong>
            </nav>
            <Link href="/login" className="admin-console-btn admin-console-topbar-signout">
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
