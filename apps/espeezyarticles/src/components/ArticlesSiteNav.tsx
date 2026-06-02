'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import EspeezyAppLogo from '@shared/EspeezyAppLogo'
import { ESPEEZY_APP_ORIGINS, buildKanbanAppUrl } from '@shared/app-url'
import { useSessionUser } from '@shared/useSessionUser'
import { supabase } from '@/lib/supabase-client'

const NAV_LINKS = [
  { href: '/', label: 'Articles', internal: true },
  { href: ESPEEZY_APP_ORIGINS.prereg, label: 'Espeezy home', internal: false },
  { href: `${ESPEEZY_APP_ORIGINS.prereg}/docs`, label: 'Documentation', internal: false },
  { href: ESPEEZY_APP_ORIGINS.kanban, label: 'Kanban', internal: false },
] as const

export default function ArticlesSiteNav() {
  const pathname = usePathname() ?? '/'
  const { user, loading } = useSessionUser(supabase)
  const signedIn = !loading && !!user

  return (
    <header className="articles-nav">
      <div className="articles-nav__inner">
        <Link href="/" className="articles-nav__brand" aria-label="Espeezy Articles home">
          <EspeezyAppLogo app="articles" variant="nav" />
        </Link>
        <nav className="articles-nav__links" aria-label="Primary navigation">
          {NAV_LINKS.map(({ href, label, internal }) => {
            const isActive = internal && pathname === href
            const className = `articles-nav__link${isActive ? ' articles-nav__link--active' : ''}`
            if (internal) {
              return (
                <Link key={href} href={href} className={className} aria-current={isActive ? 'page' : undefined}>
                  {label}
                </Link>
              )
            }
            return (
              <a key={href} href={href} className={className} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            )
          })}
          {signedIn ? (
            <a href={buildKanbanAppUrl('/')} className="articles-nav__cta" target="_blank" rel="noopener noreferrer">
              Open workspace
            </a>
          ) : (
            <a
              href={`${ESPEEZY_APP_ORIGINS.kanban}/login`}
              className="articles-nav__cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign in
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
