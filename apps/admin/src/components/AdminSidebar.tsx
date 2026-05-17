'use client'

/**
 * AdminSidebar
 *
 * Persistent navigation sidebar for the /admin subtree.
 * Links to all major admin sections. Collapsible on small screens.
 *
 * Props:
 *   adminEmail  -  shown in the footer identity card
 *   adminName   -  displayed above the email
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Megaphone,
  Rocket,
  ScrollText,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { ADMIN_NAV_ITEMS, hasAdminPermission, type AdminPermission, type AdminStaffRole } from '@/lib/admin-rbac'

const ICONS: Record<AdminPermission, React.ReactNode> = {
  overview: <LayoutDashboard size={18} />,
  users: <Users size={18} />,
  analytics: <BarChart3 size={18} />,
  announcements: <Megaphone size={18} />,
  launch: <Rocket size={18} />,
  audit: <ScrollText size={18} />,
  settings: <Settings size={18} />,
  chat: <ShieldCheck size={18} />,
}

interface Props {
  adminEmail: string
  adminName: string
  adminRole: AdminStaffRole
  username: string
}

export default function AdminSidebar({ adminEmail, adminName, adminRole, username }: Props) {
  const pathname = usePathname()

  return (
    <aside
      aria-label="Admin navigation"
      style={{
        width: '240px',
        minHeight: '100vh',
        background: '#050505',
        borderRight: '1px solid #111',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}
    >
      {/* ── Logo / brand ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '2rem 1.5rem 1.5rem',
          borderBottom: '1px solid #111',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#10b981',
          }}
        >
          <ShieldCheck size={22} aria-hidden="true" />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 950,
              textTransform: 'uppercase',
              letterSpacing: '3px',
            }}
          >
            Admin
          </span>
        </div>
      </div>

      {/* ── Navigation links ─────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {ADMIN_NAV_ITEMS.filter((link) => hasAdminPermission(adminRole, link.permission)).map((link) => {
            // Exact match for the overview link; prefix match for sub-sections
            const isActive =
              link.href === '/admin'
                ? (pathname ?? '') === '/admin'
                : (pathname ?? '').startsWith(link.href)

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.875rem',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 900 : 600,
                    color: isActive ? '#10b981' : 'rgba(255,255,255,0.5)',
                    background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {ICONS[link.permission]}
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Identity footer ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid #111',
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 900,
            color: 'white',
            marginBottom: '0.25rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {adminName}
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          @{username} · {adminRole}
        </div>
        <div
          style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.25)',
            marginTop: '0.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {adminEmail}
        </div>
      </div>
    </aside>
  )
}
