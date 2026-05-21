'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Menu } from 'lucide-react'
import { CategoriesProvider } from '@/context/CategoriesContext'
import GamesSidebar from './GamesSidebar'
import './games-shell.css'

const MOBILE_MEDIA_QUERY = '(max-width: 768px)'
const subscribeToClient = () => () => {}

export default function GamesShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY)
    const sync = (matches: boolean) => {
      setIsMobile(matches)
      setSidebarOpen(!matches)
      if (!matches) setMobileMenuOpen(false)
    }
    sync(mq.matches)
    const onChange = (e: MediaQueryListEvent) => sync(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      document.body.classList.add('body-lock')
    } else {
      document.body.classList.remove('body-lock')
    }
    return () => document.body.classList.remove('body-lock')
  }, [isMobile, mobileMenuOpen])

  if (!isClient) {
    return <div className="games-shell">{children}</div>
  }

  const mainClass = `games-shell__main${!isMobile && !sidebarOpen ? ' is-collapsed' : ''}`

  return (
    <CategoriesProvider>
      <div className="games-shell">
        <div
          className={`games-shell__backdrop${isMobile && mobileMenuOpen ? ' is-visible' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden={!mobileMenuOpen}
        />
        <GamesSidebar
          isOpen={sidebarOpen}
          isCollapsed={!sidebarOpen}
          isMobile={isMobile}
          isMobileOpen={mobileMenuOpen}
          onToggleCollapse={() => setSidebarOpen((o) => !o)}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <div className={mainClass}>
          <header className="games-mobile-bar">
            <button
              type="button"
              className="games-mobile-bar__menu"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span style={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
              Espe<span style={{ color: 'var(--games-brand)' }}>ezy</span> Games
            </span>
          </header>
          <div className="games-shell__content">{children}</div>
        </div>
      </div>
    </CategoriesProvider>
  )
}
