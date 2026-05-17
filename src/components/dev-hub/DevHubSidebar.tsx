'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Cloud,
  Gamepad2,
  LayoutDashboard,
  LayoutGrid,
  Server,
  Shield,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react'
import { adminConsoleHref, DEV_HUB_ADMIN_TABS, DEV_HUB_NAV_APPS } from './nav-config'
import { useDevHubNav } from './DevHubNavContext'
import { useDevHubShell } from './DevHubShellContext'
import { useDevHubAdminSession } from './DevHubAdminSessionContext'
import { hasHubAdminPermission } from '@/lib/hub-admin-rbac'
import { ExternalLink, Shield } from 'lucide-react'
import type { AppRuntimeStatus } from './types'

const APP_ICONS: Record<string, typeof LayoutGrid> = {
  kanban: BookOpen,
  games: Gamepad2,
  dashboard: LayoutDashboard,
  admin: Shield,
  prereg: Sparkles,
  core: Server,
}

function statusClass(status: AppRuntimeStatus | undefined): string {
  if (status === 'running' || status === 'starting') return 'dev-hub-nav-dot--running'
  if (status === 'error') return 'dev-hub-nav-dot--error'
  return ''
}

export function DevHubSidebar() {
  const pathname = usePathname()
  const { apps, metrics } = useDevHubNav()
  const { mobileNavOpen, closeMobileNav } = useDevHubShell()
  const { member: adminMember } = useDevHubAdminSession()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    closeMobileNav()
  }, [pathname, closeMobileNav])

  const runtimeById = Object.fromEntries(apps.map((a) => [a.id, a.runtime?.status]))

  return (
    <aside
      id="dev-hub-sidebar"
      className={`dev-hub-sidebar ${mobileNavOpen ? 'is-open' : ''}`}
      aria-label="Dashboard navigation"
      aria-hidden={isMobile && !mobileNavOpen}
    >
      <div className="dev-hub-sidebar-head">
        <span className="dev-hub-sidebar-head-title">Navigation</span>
        <button
          type="button"
          className="dev-hub-sidebar-close dev-hub-tap"
          aria-label="Close navigation"
          onClick={closeMobileNav}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <nav className="dev-hub-sidebar-nav">
        <p className="dev-hub-sidebar-label">Overview</p>
        <Link
          href="/dashboard"
          className={`dev-hub-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
          onClick={closeMobileNav}
        >
          <LayoutGrid size={18} aria-hidden />
          <span className="dev-hub-nav-item-text">
            <span className="dev-hub-nav-item-title">Fleet overview</span>
            <span className="dev-hub-nav-item-meta">Production & local apps</span>
          </span>
        </Link>
        <Link
          href="/dashboard#production"
          className="dev-hub-nav-item dev-hub-nav-item--sub"
          onClick={closeMobileNav}
        >
          <Cloud size={16} aria-hidden />
          <span className="dev-hub-nav-item-title">Production fleet</span>
        </Link>

        <p className="dev-hub-sidebar-label">Monorepo apps</p>
        <ul className="dev-hub-sidebar-apps">
          {DEV_HUB_NAV_APPS.map((navApp) => {
            const href = `/dashboard/${navApp.id}`
            const active = pathname === href || pathname.startsWith(`${href}/`)
            const Icon = APP_ICONS[navApp.id] ?? Server
            const status = runtimeById[navApp.id] as AppRuntimeStatus | undefined
            const row = apps.find((a) => a.id === navApp.id)
            const port = row?.port ?? navApp.port

            return (
              <li key={navApp.id}>
                <Link
                  href={href}
                  className={`dev-hub-nav-item ${active ? 'active' : ''}`}
                  style={{ '--nav-accent': navApp.accent } as React.CSSProperties}
                  onClick={closeMobileNav}
                >
                  <span className="dev-hub-nav-icon-wrap" style={{ color: navApp.accent }}>
                    <Icon size={17} aria-hidden />
                  </span>
                  <span className="dev-hub-nav-item-text">
                    <span className="dev-hub-nav-item-title">{navApp.name}</span>
                    <span className="dev-hub-nav-item-meta">:{port}</span>
                  </span>
                  <span
                    className={`dev-hub-nav-dot ${statusClass(status)}`}
                    title={status ?? 'stopped'}
                    aria-hidden
                  />
                </Link>
              </li>
            )
          })}
        </ul>

        {adminMember && (
          <>
            <p className="dev-hub-sidebar-label">Admin console</p>
            <ul className="dev-hub-sidebar-apps">
              {DEV_HUB_ADMIN_TABS.filter((tab) =>
                hasHubAdminPermission(adminMember.admin_role, tab.permission),
              ).map((tab) => (
                <li key={tab.path}>
                  <a
                    href={adminConsoleHref(tab.path)}
                    className="dev-hub-nav-item dev-hub-nav-item--external"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobileNav}
                  >
                    <span className="dev-hub-nav-icon-wrap" style={{ color: '#f59e0b' }}>
                      <Shield size={17} aria-hidden />
                    </span>
                    <span className="dev-hub-nav-item-text">
                      <span className="dev-hub-nav-item-title">{tab.label}</span>
                    </span>
                    <ExternalLink size={14} className="dev-hub-nav-external" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <footer className="dev-hub-sidebar-foot">
        <div className="dev-hub-sidebar-stat">
          <span className="dev-hub-sidebar-stat-label">Running</span>
          <span className="dev-hub-sidebar-stat-value">{metrics?.running ?? '—'}</span>
        </div>
        <div className="dev-hub-sidebar-stat">
          <span className="dev-hub-sidebar-stat-label">Hub</span>
          <span className="dev-hub-sidebar-stat-value">:{metrics?.hubPort ?? 3000}</span>
        </div>
      </footer>
    </aside>
  )
}
