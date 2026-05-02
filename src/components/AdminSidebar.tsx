'use client'

/**
 * AdminSidebar
 *
 * Persistent navigation sidebar for the /admin subtree.
 * Links to all major admin sections. Collapsible on small screens.
 *
 * Props:
 *   adminEmail — shown in the footer identity card
 *   adminName  — displayed above the email
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

// ── Nav link definition ────────────────────────────────────────────────────────

interface NavLink {
  href: string
  label: string
  icon: React.ReactNode
}

const NAV_LINKS: NavLink[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { href: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { href: '/admin/launch', label: 'Launch', icon: <Rocket size={18} /> },
  { href: '/admin/audit', label: 'Audit Log', icon: <ScrollText size={18} /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
]

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  adminEmail: string
  adminName: string
}

export default function AdminSidebar({ adminEmail, adminName }: Props) {
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
          {NAV_LINKS.map((link) => {
            // Exact match for the overview link; prefix match for sub-sections
            const isActive =
              link.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(link.href)

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
                  {link.icon}
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
          {adminEmail}
        </div>
      </div>
    </aside>
  )
}
