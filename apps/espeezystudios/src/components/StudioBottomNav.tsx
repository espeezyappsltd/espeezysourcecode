'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { filterStudioNavLinks, isStudioNavActive, STUDIO_NAV_LINKS } from '@/lib/studio/nav-links'
import { useStudioEditor } from '@/hooks/useStudioEditor'

export default function StudioBottomNav() {
  const pathname = usePathname() ?? '/'
  const { canEdit: isAdmin, loading } = useStudioEditor()

  const links = filterStudioNavLinks(
    STUDIO_NAV_LINKS.filter((link) => link.bottomNav),
    isAdmin,
    !loading,
  )

  return (
    <nav className="studio-bottom-nav" aria-label="Studio primary">
      {links.map((link) => {
        const active = isStudioNavActive(pathname, link.url)
        const Icon = link.icon
        return (
          <Link
            key={link.url}
            href={link.url}
            className={`studio-bottom-nav__item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="studio-bottom-nav__icon-wrap">
              <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden />
              {active ? <span className="studio-bottom-nav__active-dot" aria-hidden /> : null}
            </span>
            <span className="studio-bottom-nav__label">{link.shortName ?? link.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
