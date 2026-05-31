'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Settings,
  UserCircle,
} from 'lucide-react'
import { ThemeCycleButton } from '@shared/ThemeCycleButton'
import EspeezyAppLogo from '@shared/EspeezyAppLogo'
import { useCategoriesContext } from '@/context/CategoriesContext'
import { useKanbanAppLink } from '@/hooks/useKanbanAppLink'
import { useKanbanWorkspaceLink } from '@/hooks/useKanbanWorkspaceLink'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import { getSupabaseClient } from '@/lib/supabase-client'

const MOBILE_MEDIA_QUERY = '(max-width: 768px)'
const subscribeToClient = () => () => {}

const CATEGORY_GLOWS = ['#818cf8', '#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#fb923c']

type GamesSidebarProps = {
  isOpen: boolean
  isCollapsed: boolean
  isMobile: boolean
  isMobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
}

function SidebarNavButton({
  collapsed,
  isActive,
  label,
  onClick,
  icon: Icon,
}: {
  collapsed: boolean
  isActive: boolean
  label: string
  onClick: () => void
  icon: typeof Home
}) {
  return (
    <button
      type="button"
      className={`games-sidebar__nav-btn${isActive ? ' is-active' : ''}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

export default function GamesSidebar({
  isOpen,
  isCollapsed,
  isMobile,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: GamesSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { categories, loading } = useCategoriesContext()
  const user = useSupabaseUser()
  const kanbanUrl = useKanbanWorkspaceLink()
  const kanbanAppearanceUrl = useKanbanAppLink('/settings?tab=appearance')
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const activeCategoryId = useMemo(() => {
    const match = pathname?.match(/^\/categories\/([^/]+)/)
    return match?.[1] ?? null
  }, [pathname])

  const activeGameId = useMemo(() => {
    const match = pathname?.match(/^\/games\/([^/]+)/)
    return match?.[1] ?? null
  }, [pathname])

  useEffect(() => {
    if (activeCategoryId) {
      setExpandedIds((prev) => new Set(prev).add(activeCategoryId))
    }
  }, [activeCategoryId])

  if (!isClient) return null

  const collapsed = !isMobile && !isOpen
  const sidebarClass = [
    'games-sidebar',
    isMobile ? (isMobileOpen ? 'is-mobile-open' : '') : isOpen ? 'is-open' : 'is-collapsed',
  ]
    .filter(Boolean)
    .join(' ')

  const navigate = (path: string) => {
    router.push(path)
    if (isMobile) onCloseMobile()
  }

  const toggleCategory = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    if (supabase) await supabase.auth.signOut()
    router.push('/login')
    if (isMobile) onCloseMobile()
  }

  return (
    <aside className={sidebarClass} aria-label="Games navigation">
      <div className="games-sidebar__head">
        <Link href="/" className="games-sidebar__brand" onClick={() => isMobile && onCloseMobile()}>
          {collapsed ? (
            <EspeezyAppLogo app="games" variant="mark" />
          ) : (
            <EspeezyAppLogo app="games" variant="nav" />
          )}
        </Link>
        {!isMobile && (
          <button
            type="button"
            className="games-sidebar__toggle hide-mobile"
            onClick={onToggleCollapse}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>

      <nav className="games-sidebar__nav">
        <SidebarNavButton
          collapsed={collapsed}
          isActive={pathname === '/'}
          label="Browse all"
          icon={Home}
          onClick={() => navigate('/')}
        />

        {!collapsed && <div className="games-sidebar__section-label">Categories</div>}

        {loading && !collapsed && (
          <p style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', color: 'var(--games-muted)' }}>Loading…</p>
        )}

        {categories.map((cat, index) => {
          const isCatActive = activeCategoryId === cat.id
          const isExpanded = expandedIds.has(cat.id) || isCatActive
          const games = cat.games ?? []
          const glow = CATEGORY_GLOWS[index % CATEGORY_GLOWS.length]

          if (collapsed) {
            return (
              <SidebarNavButton
                key={cat.id}
                collapsed
                isActive={isCatActive}
                label={cat.name}
                icon={LayoutGrid}
                onClick={() => navigate(`/categories/${cat.id}`)}
              />
            )
          }

          return (
            <div key={cat.id} className="games-sidebar__category">
              <div className="games-sidebar__category-head">
                <button
                  type="button"
                  className={`games-sidebar__category-btn${isCatActive ? ' is-active' : ''}`}
                  onClick={() => navigate(`/categories/${cat.id}`)}
                  style={{ borderLeft: isCatActive ? `3px solid ${glow}` : undefined }}
                >
                  <LayoutGrid size={15} style={{ color: glow, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </span>
                  <span className="games-sidebar__category-count">{games.length}</span>
                </button>
                {games.length > 0 && (
                  <button
                    type="button"
                    className="games-sidebar__expand"
                    onClick={() => toggleCategory(cat.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Collapse games' : 'Expand games'}
                  >
                    <ChevronDown
                      size={16}
                      style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
                    />
                  </button>
                )}
              </div>
              {isExpanded && games.length > 0 && (
                <ul className="games-sidebar__games">
                  {games.map((game) => (
                    <li key={game.id}>
                      <Link
                        href={`/games/${game.id}`}
                        className={`games-sidebar__game-link${activeGameId === game.id ? ' is-active' : ''}`}
                        onClick={() => isMobile && onCloseMobile()}
                      >
                        {game.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      <div className="games-sidebar__foot">
        {user ? (
          <>
            <Link href="/profile" className="games-sidebar__foot-link" onClick={() => isMobile && onCloseMobile()}>
              <UserCircle size={18} />
              <span>My profile</span>
            </Link>
            <Link href="/settings" className="games-sidebar__foot-link" onClick={() => isMobile && onCloseMobile()}>
              <Settings size={18} aria-hidden />
              <span>Theme settings</span>
            </Link>
            <a href={kanbanUrl} className="games-sidebar__foot-link">
              <LayoutGrid size={18} aria-hidden />
              <span>Kanban workspace</span>
            </a>
            <div className="games-sidebar__foot-actions">
              <ThemeCycleButton
                className="games-sidebar__foot-link games-sidebar__theme-btn"
                labelClassName=""
                showLabel={!collapsed}
                onLocked={() => {
                  window.location.href = kanbanAppearanceUrl
                }}
              />
            </div>
            <button type="button" className="games-sidebar__foot-link" onClick={() => void handleSignOut()}>
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </>
        ) : (
          <Link href="/login?next=/" className="games-sidebar__foot-link" onClick={() => isMobile && onCloseMobile()}>
            <LogIn size={18} />
            <span>Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  )
}
