'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Settings,
  Bell,
  TrendingUp,
  Rss,
  DollarSign
} from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'
import { useRouter } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCount } = useNotifications()
  const { withLoading } = useSmartLoading()

  const navLinks = [
    { name: 'Board', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Feed', path: '/feed', icon: Rss },
    { name: 'Hustle', path: '/dashboard/hustle', icon: DollarSign },
    { name: 'Network', path: '/dashboard/network', icon: Users },
    { name: 'Inbox', path: '/dashboard/notifications', icon: Bell },
  ]

  const handleNav = (path: string, name: string) => {
    if (pathname === path) return;
    router.push(path);
  }

  return (
    <nav className="mobile-bottom-nav glass" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--h-mobile-bottom)',
      backgroundColor: 'rgba(var(--bg-sub-rgb), 0.8)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      zIndex: 4000,
      padding: '0 1rem',
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center'
    }}>
      {navLinks.map((link) => {
        const isActive = pathname === link.path
        return (
          <button 
            key={link.path} 
            onClick={() => handleNav(link.path, link.name)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--brand)' : 'var(--text-sub)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: '0.5rem',
              flex: 1,
              outline: 'none'
            }}
          >
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isActive ? 'scale(1.1) translateY(-2px)' : 'none',
              transition: 'transform 0.3s ease'
            }}>
              <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {link.name === 'Inbox' && unreadCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-10px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  borderRadius: '10px',
                  background: 'var(--brand)',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--surface)',
                  boxShadow: '0 0 10px rgba(var(--brand-rgb), 0.5)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
              {isActive && link.name !== 'Inbox' && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  boxShadow: '0 0 8px var(--brand)'
                }} />
              )}
            </div>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: isActive ? 800 : 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {link.name}
            </span>
          </button>
        )
      })}

    </nav>
  )
}
