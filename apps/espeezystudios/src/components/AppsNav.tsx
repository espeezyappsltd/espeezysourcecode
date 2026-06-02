'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X } from 'lucide-react'
import { ThemeCycleButton } from '@shared/ThemeCycleButton'
import StudiosLogo from '@/components/StudiosLogo'
import { useStudioEditor } from '@/hooks/useStudioEditor'
import {
  filterStudioNavLinks,
  isStudioNavActive,
  STUDIO_NAV_LINKS,
  type StudioNavLink,
} from '@/lib/studio/nav-links'

function NavLinkItem({
  link,
  pathname,
  drawer = false,
  onNavigate,
}: {
  link: StudioNavLink
  pathname: string
  drawer?: boolean
  onNavigate?: () => void
}) {
  const active = isStudioNavActive(pathname, link.url)
  const Icon = link.icon
  return (
    <li>
      <Link
        href={link.url}
        className={`apps-nav-pro__link${drawer ? ' apps-nav-pro__drawer-link' : ''}${active ? ' is-active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
      >
        {drawer ? <Icon size={18} aria-hidden /> : null}
        <span>{link.name}</span>
      </Link>
    </li>
  )
}

export default function AppsNav() {
  const pathname = usePathname() ?? '/'
  const { canEdit: isAdmin, loading } = useStudioEditor()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuId = useId()

  const visibleLinks = filterStudioNavLinks(STUDIO_NAV_LINKS, isAdmin, !loading)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    closeMenu()
  }, [pathname, closeMenu])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, closeMenu])

  const menuOverlay =
    menuOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="apps-nav-pro__backdrop"
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <div id={menuId} className="apps-nav-pro__drawer" role="dialog" aria-modal="true" aria-label="Studio menu">
              <div className="apps-nav-pro__drawer-head">
                <span className="apps-nav-pro__drawer-title">Menu</span>
                <button type="button" className="apps-nav-pro__drawer-close" aria-label="Close menu" onClick={closeMenu}>
                  <X size={20} aria-hidden />
                </button>
              </div>
              <ul className="apps-nav-pro__drawer-list">
                {visibleLinks.map((link) => (
                  <NavLinkItem key={link.url} link={link} pathname={pathname} drawer onNavigate={closeMenu} />
                ))}
              </ul>
              <div className="apps-nav-pro__drawer-theme">
                <span className="apps-nav-pro__drawer-theme-label">Theme</span>
                <ThemeCycleButton className="apps-nav-pro__theme" labelClassName="apps-nav-pro__theme-label" />
              </div>
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <nav className={`apps-nav-pro${menuOpen ? ' is-menu-open' : ''}`} aria-label="Studio apps">
      <div className="apps-nav-pro__bar">
        <div className="apps-nav-pro__start">
          <button
            type="button"
            className="apps-nav-pro__menu-btn"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
          <Link href="/" className="apps-nav-pro__brand">
            <StudiosLogo variant="nav" />
          </Link>
        </div>

        <ul className="apps-nav-pro__list apps-nav-pro__list--desktop">
          {visibleLinks.map((link) => (
            <NavLinkItem key={link.url} link={link} pathname={pathname} />
          ))}
        </ul>

        <div className="apps-nav-pro__tools">
          <ThemeCycleButton className="apps-nav-pro__theme" labelClassName="apps-nav-pro__theme-label" />
        </div>
      </div>

      {menuOverlay}
    </nav>
  )
}
