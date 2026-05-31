'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Menu } from 'lucide-react'
import { CategoriesProvider } from '@/context/CategoriesContext'
import GamesSidebar from './GamesSidebar'
import { GAMES_SHELL_TAGLINE } from '@shared/app-ui-copy'
import AppCopyrightStrip from '@shared/AppCopyrightStrip'
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

  const mainClass = `games-shell__main${isClient && !isMobile && !sidebarOpen ? ' is-collapsed' : ''}`

  return (
    <CategoriesProvider>
      <div className="games-shell">
        {isClient && (
          <div
            className={`games-shell__backdrop${isMobile && mobileMenuOpen ? ' is-visible' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden={!mobileMenuOpen}
          />
        )}
        {isClient && (
          <GamesSidebar
            isOpen={sidebarOpen}
            isCollapsed={!sidebarOpen}
            isMobile={isMobile}
            isMobileOpen={mobileMenuOpen}
            onToggleCollapse={() => setSidebarOpen((o) => !o)}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        )}
        <div className={mainClass}>
          {isClient && (
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
          )}
          <div className="games-shell__content">
            {children}
            <footer className="games-shell__footer" aria-label="Site footer">
              <p className="games-shell__footer-tagline">{GAMES_SHELL_TAGLINE}</p>
              <AppCopyrightStrip style={{ color: 'var(--games-muted)' }} showTagline />
            </footer>
          </div>
        </div>
      </div>
    </CategoriesProvider>
  )
}
