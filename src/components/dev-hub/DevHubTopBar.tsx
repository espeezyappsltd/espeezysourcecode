'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, LogOut, Menu, RefreshCw, X } from 'lucide-react'
import { getNavApp } from './nav-config'
import { useDevHubNav } from './DevHubNavContext'
import { useDevHubShell } from './DevHubShellContext'

export function DevHubTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { refresh } = useDevHubNav()
  const { mobileNavOpen, toggleMobileNav } = useDevHubShell()

  const workspaceMatch = pathname.match(/^\/dashboard\/([^/]+)/)
  const activeAppId = workspaceMatch?.[1]
  const activeApp = activeAppId ? getNavApp(activeAppId) : undefined
  const onDashboard = pathname === '/dashboard'

  async function logout() {
    await fetch('/api/dev/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="dev-hub-topbar" role="banner">
      <div className="dev-hub-topbar-start">
        <button
          type="button"
          className="dev-hub-menu-btn dev-hub-tap"
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileNavOpen}
          aria-controls="dev-hub-sidebar"
          onClick={toggleMobileNav}
        >
          {mobileNavOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
        <Link href="/dashboard" className="dev-hub-topbar-brand dev-hub-tap">
          <span className="dev-hub-brand-mark dev-hub-brand-mark--sm">
            <Image src="/brand_logo2.svg" width={22} height={22} alt="" priority />
          </span>
          <span className="dev-hub-topbar-brand-text">
            <span className="dev-hub-topbar-brand-title">Espeezy</span>
            <span className="dev-hub-topbar-brand-sub">Command Center</span>
          </span>
        </Link>

        <nav className="dev-hub-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/dashboard" className={`dev-hub-crumb ${onDashboard ? 'active' : ''}`}>
            Dashboard
          </Link>
          {activeApp && (
            <>
              <ChevronRight size={14} className="dev-hub-crumb-sep" aria-hidden />
              <span className="dev-hub-crumb active" aria-current="page">
                {activeApp.name}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="dev-hub-topbar-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-inline dev-hub-tap"
          aria-label="Refresh fleet status"
          onClick={() => void refresh()}
        >
          <RefreshCw size={15} aria-hidden />
          <span className="dev-hub-topbar-action-label">Refresh</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-inline dev-hub-tap"
          aria-label="Sign out"
          onClick={() => void logout()}
        >
          <LogOut size={15} aria-hidden />
          <span className="dev-hub-topbar-action-label">Sign out</span>
        </button>
      </div>
    </header>
  )
}
