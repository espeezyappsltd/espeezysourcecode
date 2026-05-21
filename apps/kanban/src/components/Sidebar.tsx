'use client'

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { showToast } from '@/utils/toast';
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Menu,
  HardDrive,
  LayoutDashboard,
  Lock,
  HelpCircle,
  LogOut,
  Music,
  Moon,
  Rss,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  UserCircle,
  Users,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'
import { usePresence } from '@/components/PresenceProvider'
import { useConnectivity } from '@/context/ConnectivityContext'
import { useProfile } from '@/context/ProfileContext'
import { useTheme } from '@/context/ThemeContext'
import { SidebarProps } from '@/types/ui'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import GlobalSearch from './GlobalSearch'
import { MobileHeaderToolbar } from './mobile/MobileHeaderToolbar'
import NotificationBell from './NotificationBell'
import { hasFeature } from '@/utils/feature-gate'
import RemoteAvatar from '@/components/common/RemoteAvatar'
import { APP_PRICING_PATH } from '@/lib/pricing/plan-routes'
import { SIDEBAR_UPGRADE_BLURB } from '@shared/platform-brand'
import './sidebar-premium.css'

const MOBILE_MEDIA_QUERY = '(max-width: 768px)'
const THEME_SEQUENCE = ['Google Light', 'Deep Oceanic', 'Cyberpunk'] as const
const PREMIUM_LINKS = new Set(['Break Room', 'Project Stats'])
const subscribeToClient = () => () => {}

type SidebarNavItem = {
  name: string
  path: string
  icon: LucideIcon
}

const NAV_LINKS: SidebarNavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Feed', path: '/feed', icon: Rss },
  { name: 'Hustle', path: '/hustle', icon: DollarSign },
  { name: 'Teammates', path: '/network', icon: Users },
  { name: 'My Assets', path: '/assets', icon: HardDrive },
  { name: 'Resources', path: '/marketplace', icon: TrendingUp },
  { name: 'Break Room', path: '/chillout', icon: Sparkles },
  { name: 'Jukebox', path: '/jukebox', icon: Music },
  { name: 'Project Stats', path: '/analytics', icon: BarChart3 },
  { name: 'My Profile', path: '/profile', icon: UserCircle },
  { name: 'Settings', path: '/settings', icon: Settings },
]

function BrandWordmark() {
  return (
    <>
      Espe<span style={{ color: 'var(--brand)' }}>ezy</span>
    </>
  )
}

function PresenceDot({ isOnline }: { isOnline: boolean }) {
  return (
    <div
      className={isOnline ? 'pulse-pill' : ''}
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: isOnline ? 'var(--success)' : 'var(--text-sub)',
        boxShadow: isOnline ? '0 0 8px var(--success)' : 'none',
      }}
    />
  )
}

function ProfileAvatar({
  avatarUrl,
  fallback,
  size,
  alt,
}: {
  avatarUrl?: string | null
  fallback: React.ReactNode
  size: number
  alt: string
}) {
  return (
    <RemoteAvatar
      src={avatarUrl}
      alt={alt}
      size={size}
      fallback={fallback}
      imgStyle={{ width: '100%', height: 'auto', aspectRatio: '1/1', objectFit: 'cover' }}
    />
  )
}

function SidebarNavButton({
  collapsed,
  isActive,
  isLocked,
  label,
  onClick,
  icon: Icon,
}: {
  collapsed: boolean
  isActive: boolean
  isLocked: boolean
  label: string
  onClick: () => void
  icon: LucideIcon
}) {
  return (
    <button
      onClick={onClick}
      className={`nav-bubble sidebar-nav-btn ${isActive ? 'active-project' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: collapsed ? '0.5rem 0' : '0.5rem 1rem',
        color: isActive ? 'var(--brand)' : 'var(--text-sub)',
        backgroundColor: isActive ? 'rgba(var(--brand-rgb), 0.05)' : 'transparent',
        fontWeight: isActive ? 900 : 700,
        fontSize: '0.85rem',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: collapsed ? '12px' : '0 30px 30px 0',
        marginRight: collapsed ? '0.75rem' : '1rem',
        marginLeft: collapsed ? '0.75rem' : '0',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        width: collapsed ? 'calc(100% - 1.5rem)' : 'calc(100% - 1rem)',
      }}
      title={collapsed ? label : ''}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      {!collapsed && (
        <>
          <span style={{ letterSpacing: '-0.01em' }}>{label}</span>
          {isLocked && <span className="locked-badge locked-badge-premium">PREMIUM</span>}
        </>
      )}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '15%',
            bottom: '15%',
            width: '4px',
            background: 'var(--brand)',
            borderRadius: '0 4px 4px 0',
          }}
        />
      )}
    </button>
  )
}

export default function Sidebar({ user }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false)

  const { isOnline: isConnected, isSlow } = useConnectivity()
  const { profile } = useProfile()
  const { currentPalette, setPalette } = useTheme()
  const { globalOnlineCount } = usePresence()
  const smartLoading = useSmartLoading()
  const withLoading = smartLoading?.withLoading
  const showConfirmation = smartLoading?.showConfirmation

  const isProfileLoaded = Boolean(profile)
  const onlineCount = globalOnlineCount
  const onlineLabel = onlineCount === 1 ? '1 ONLINE' : `${onlineCount} ONLINE`
  const isDark = currentPalette.name !== 'Google Light'
  const isPremiumMember = hasFeature(profile, 'PROJECT_STATS')
  const showUpgradeCard = profile?.subscription_plan === 'free' || !profile?.subscription_plan
  const projectStatsPath = profile?.group_id ? `/analytics/${profile.group_id}` : '/analytics'

  const navLinks = useMemo(
    () =>
      NAV_LINKS.map((link) =>
        link.name === 'Project Stats'
          ? { ...link, path: projectStatsPath }
          : link
      ),
    [projectStatsPath]
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)

    const syncFromViewport = (matchesMobile: boolean) => {
      setIsMobile(matchesMobile)
      setIsOpen(!matchesMobile)
    }

    syncFromViewport(mediaQuery.matches)

    const handleViewportChange = (event: MediaQueryListEvent) => {
      syncFromViewport(event.matches)
    }

    mediaQuery.addEventListener('change', handleViewportChange)
    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.classList.add('body-lock')
    } else {
      document.body.classList.remove('body-lock')
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('body-lock')
      }
    }
  }, [isMobile, isOpen])

  const closeSidebar = () => setIsOpen(false)

  const pushRoute = (path: string) => {
    router.push(path)
    if (isMobile) {
      closeSidebar()
    }
  }

  const toggleTheme = () => {
    const currentIndex = THEME_SEQUENCE.indexOf(currentPalette.name as (typeof THEME_SEQUENCE)[number])
    const safeIndex = currentIndex === -1 ? 0 : currentIndex
    const nextIndex = (safeIndex + 1) % THEME_SEQUENCE.length
    setPalette(THEME_SEQUENCE[nextIndex])
  }

  const handleNavigation = (path: string) => {
    if (pathname === path) {
      return
    }

    pushRoute(path)
  }

  const handleSignOut = () => {
    if (typeof showConfirmation === 'function') {
      showConfirmation({
        title: 'End Session?',
        message: 'Ready to sign out? Your team will be waiting when you get back.',
        type: 'warning',
        onConfirm: async () => {
          if (typeof withLoading === 'function') {
            await withLoading(async () => {
              if (user?.id) {
                await db
                  .from('profiles')
                  .update({ last_seen: new Date().toISOString() })
                  .eq('id', user.id)
              }

              try {
                if (db.auth && typeof db.auth.signOut === 'function') {
                  const { error } = await db.auth.signOut()
                  if (error) {
                    showToast('Sign Out Error: ' + (error.message || 'An error occurred during sign out.'), 'error')
                    console.error('Sign out error:', error)
                  }
                }
              } catch (err) {
                console.error('Unexpected sign out error:', err)
              } finally {
                window.location.href = '/login'
              }
            }, 'Signing you out...')
          }
        },
        onCancel: () => {},
      })
    }
  }

  const isNavItemActive = (path: string, name: string) => {
    if (name === 'Project Stats') {
      return (pathname ?? '').startsWith('/analytics')
    }

    if (path === '/') {
      return (pathname ?? '') === path
    }

    return (pathname ?? '').startsWith(path)
  }

  if (!isClient) {
    return null
  }

  return (
    <div style={{ display: 'contents' }}>
      <div className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`} onClick={closeSidebar} />

      <header className="mobile-header hide-desktop" aria-label="App navigation">
        <div className="mobile-header__brand">
          <button type="button" className="mobile-header__menu-btn" onClick={() => setIsOpen(true)} aria-label="Open menu">
            <Menu size={22} strokeWidth={2.25} aria-hidden />
          </button>
          <div className="mobile-header__online-stat" aria-label={`${onlineCount} users online`}>
            <Users size={18} strokeWidth={2.25} className="mobile-header__online-icon" aria-hidden />
            <span className="mobile-header__online-count" data-testid="mobile-header-online-count">
              {onlineCount}
            </span>
            <PresenceDot isOnline={isProfileLoaded} />
          </div>
        </div>

        <MobileHeaderToolbar />

        <div className="mobile-header__actions">
          <div className="mobile-header__notif">
            <NotificationBell />
          </div>
          <button type="button" className="mobile-header__avatar-btn" onClick={() => pushRoute('/profile')} aria-label="Open profile">
            <ProfileAvatar avatarUrl={profile?.avatar_url} fallback={<UserCircle size={18} color="var(--text-sub)" />} size={34} alt="" />
          </button>
        </div>
      </header>

      <aside
        className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}
        aria-hidden={!isOpen && isMobile}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: isOpen ? '280px' : '84px',
          maxWidth: '85vw',
          backgroundColor: 'var(--bg-sub)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: isMobile ? 5100 : 4600,
          boxShadow: isOpen && isMobile ? '20px 0 50px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        <div className="sidebar-top" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', minHeight: 'var(--h-nav)', flexShrink: 0 }}>
          {isOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
              <button
                onClick={() => pushRoute('/')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontWeight: 950, fontSize: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.04em', flexShrink: 0 }}
              >
                <BrandWordmark />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '4px 10px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                <PresenceDot isOnline={isProfileLoaded} />
                <span style={{ fontSize: '0.6rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '0.05em' }} data-testid="sidebar-online-count">{onlineLabel}</span>
              </div>
              <div style={{ flex: 1 }} />
              <div className="hide-mobile" style={{ marginRight: '0.25rem', flexShrink: 0 }}>
                <NotificationBell />
              </div>
            </div>
          ) : (
            <div className="hide-mobile" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
              <NotificationBell />
            </div>
          )}

          <button
            onClick={() => setIsOpen((current) => !current)}
            style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex', padding: '8px' }}
            className="hover-card hide-mobile"
            aria-label={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isOpen ? <ChevronLeft size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
          </button>

          <button
            onClick={closeSidebar}
            className="hide-desktop"
            style={{ background: 'rgba(var(--text-main-rgb), 0.05)', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}
            aria-label="Close Sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="sidebar-search" style={{ padding: isOpen ? '0.5rem 0.6rem 0' : '0.75rem 0.5rem 0', flexShrink: 0 }}>
          <GlobalSearch collapsed={!isOpen} />
        </div>

        <nav className="sidebar-nav-scroll" aria-label="Main navigation" style={{ flex: 1, minHeight: 0, padding: '0.35rem 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navLinks.map((link) => (
            <SidebarNavButton
              key={link.name}
              collapsed={!isOpen}
              isActive={isNavItemActive(link.path, link.name)}
              isLocked={PREMIUM_LINKS.has(link.name) && !isPremiumMember}
              label={link.name}
              icon={link.icon}
              onClick={() => {
                if (PREMIUM_LINKS.has(link.name) && !isPremiumMember) {
                  window.location.href = APP_PRICING_PATH
                  return
                }
                handleNavigation(link.path)
              }}
            />
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-foot">
            {isOpen && showUpgradeCard && (
              <div className="sidebar-foot__upgrade sidebar-upgrade-card">
                <div
                  className="glass-card-prestige"
                  style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => { window.location.href = APP_PRICING_PATH }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { window.location.href = APP_PRICING_PATH } }}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', background: 'var(--brand)', filter: 'blur(35px)', opacity: 0.2 }} aria-hidden />
                  <div className="sidebar-foot__upgrade-eyebrow">
                    <Sparkles size={14} className="shimmer-gold" aria-hidden />
                    Team support
                  </div>
                  <p className="sidebar-foot__upgrade-title">Upgrade to Pro Member</p>
                  <p className="sidebar-foot__upgrade-copy">{SIDEBAR_UPGRADE_BLURB}</p>
                </div>
              </div>
            )}

            <div className="sidebar-foot__vault" data-connected={isConnected ? 'true' : 'false'}>
              <div className="sidebar-foot__vault-icon" aria-hidden>
                {isConnected ? <ShieldCheck size={17} /> : <WifiOff size={17} />}
              </div>
              <div className="sidebar-foot__vault-body">
                <div className="sidebar-foot__vault-title">
                  {isConnected ? 'Vault Verified' : 'Uplink Offline'}
                </div>
                <div className="sidebar-foot__vault-sub">
                  {isSlow ? 'Bandwidth restricted' : 'Optimal connectivity'}
                </div>
                <div className="sidebar-foot__vault-meta">
                  <span>Node GF-2026-X</span>
                  <Lock size={10} aria-hidden />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-foot__help"
              aria-label="Help and onboarding"
              title="Help & Onboarding"
              onClick={() => window.dispatchEvent(new CustomEvent('open-help-tray'))}
            >
              <span className="sidebar-foot__help-icon" aria-hidden>
                <HelpCircle size={17} />
              </span>
              <span className="sidebar-foot__help-label">Help & Onboarding</span>
            </button>

            <div className="sidebar-foot__session">
              <button
                type="button"
                className="sidebar-foot__profile identity-pill"
                onClick={() => pushRoute('/profile')}
                aria-label="Open profile"
              >
                <div className="sidebar-foot__avatar">
                  <ProfileAvatar avatarUrl={profile?.avatar_url} fallback={profile?.full_name?.charAt(0) || 'U'} size={36} alt="User avatar" />
                </div>
                <div className="sidebar-foot__profile-text">
                  <div className="sidebar-foot__profile-name">{profile?.full_name || 'Anonymous'}</div>
                  <div className="sidebar-foot__profile-status">Session active</div>
                </div>
              </button>

              <div className="sidebar-foot__actions">
                <button
                  type="button"
                  className="sidebar-foot-btn sidebar-foot-btn--theme"
                  onClick={toggleTheme}
                  title={`Theme: ${currentPalette.name}`}
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
                  <span className="sidebar-foot-btn-label">Theme</span>
                </button>
                <button
                  type="button"
                  className="sidebar-foot-btn sidebar-foot-btn--signout"
                  onClick={handleSignOut}
                  title="End session"
                  aria-label="Sign out"
                >
                  <LogOut size={17} aria-hidden />
                  <span className="sidebar-foot-btn-label">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-container {
          backdrop-filter: blur(20px);
          height: var(--vh-dynamic);
        }

        .sidebar-nav-scroll {
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }

        .sidebar-bottom {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }

        .nav-bubble {
          position: relative;
          overflow: hidden;
        }

        .nav-bubble:hover {
          transform: translateX(6px);
          color: var(--brand) !important;
          background: rgba(var(--brand-rgb), 0.08) !important;
        }

        .nav-bubble:active {
          transform: scale(0.96);
        }

        .sidebar-foot__profile.identity-pill:hover {
          box-shadow: none;
        }

        .sidebar-backdrop {
          display: none;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: fixed;
          inset: 0;
          z-index: 4500;
        }

        @media (max-width: 768px) {
          .sidebar-backdrop {
            display: block;
          }

          .sidebar-backdrop.visible {
            pointer-events: auto;
            opacity: 1;
            visibility: visible;
          }

          .sidebar-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            z-index: 5100 !important;
            background: var(--surface) !important;
            box-shadow: 30px 0 60px rgba(0,0,0,0.5) !important;
            transform: translateX(-100%);
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
            width: min(85vw, 300px) !important;
            max-width: 300px !important;
            border-right: 1px solid rgba(255,255,255,0.05) !important;
            padding-bottom: env(safe-area-inset-bottom, 0);
          }

          .sidebar-container.open {
            transform: translateX(0) !important;
          }

          .sidebar-top {
            padding: 0.55rem 0.75rem !important;
            min-height: 52px !important;
          }

          .sidebar-search {
            padding: 0.35rem 0.5rem 0 !important;
          }

          .sidebar-nav-scroll {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            max-height: none !important;
          }

          .sidebar-nav-scroll :global(.sidebar-nav-btn) {
            padding: 0.4rem 0.85rem !important;
            font-size: 0.8rem !important;
            margin-right: 0.65rem !important;
          }

          .sidebar-bottom {
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
        }

        .glass-card-prestige {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.3s ease;
        }

        .glass-card-prestige:hover {
          background: rgba(255,255,255,0.05);
          border-color: var(--brand);
          transform: translateY(-2px);
        }

        .active-project::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: 0 0 0 2px var(--brand);
          opacity: 0;
          animation: pulse-border 3s infinite;
        }

        @keyframes pulse-border {
          0% {
            opacity: 0;
            transform: scale(1);
          }

          50% {
            opacity: 0.2;
            transform: scale(1.02);
          }

          100% {
            opacity: 0;
            transform: scale(1);
          }
        }

        .pulse-pill {
          animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
          0% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: 0.5;
            transform: scale(1.3);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .locked-badge-premium {
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          color: black !important;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 0.55rem;
          font-weight: 950;
          margin-left: auto;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
        }

        .support-link:hover {
          background: rgba(16,185,129,0.12) !important;
          border-color: rgba(16,185,129,0.3) !important;
        }
      `}</style>
    </div>
  )
}
