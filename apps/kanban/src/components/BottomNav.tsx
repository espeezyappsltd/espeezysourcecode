'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Bell, Rss, Briefcase, Users } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCount } = useNotifications()

  const navLinks = [
    { name: 'Board', path: '/', icon: LayoutDashboard },
    { name: 'Feed', path: '/feed', icon: Rss },
    { name: 'Team', path: '/network', icon: Users },
    { name: 'Studio', path: '/studio', icon: Briefcase },
    { name: 'Inbox', path: '/notifications', icon: Bell },
  ]

  const handleNav = (path: string) => {
    if (pathname === path) return
    router.push(path)
  }

  return (
    <nav className="mobile-bottom-nav hide-desktop" aria-label="Primary">
      {navLinks.map((link) => {
        const isActive =
          pathname === link.path ||
          (link.path === '/studio' && (pathname?.startsWith('/studio') ?? false))

        return (
          <button
            key={link.path}
            type="button"
            aria-label={link.name}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => handleNav(link.path)}
            className={`mobile-bottom-nav__item${isActive ? ' mobile-bottom-nav__item--active' : ''}`}
          >
            <span className="mobile-bottom-nav__icon-wrap">
              <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              {link.name === 'Inbox' && unreadCount > 0 ? (
                <span className="mobile-bottom-nav__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              ) : null}
              {isActive && link.name !== 'Inbox' ? (
                <span className="mobile-bottom-nav__active-dot" aria-hidden />
              ) : null}
            </span>
            <span className="mobile-bottom-nav__label">{link.name}</span>
          </button>
        )
      })}
    </nav>
  )
}
