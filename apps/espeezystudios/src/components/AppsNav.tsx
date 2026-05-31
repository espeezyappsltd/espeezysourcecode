'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navlinks = [
  { name: 'Home', url: '/' },
  { name: 'Team', url: '/team' },
  { name: 'Analytics', url: '/analytics' },
  { name: 'Profile', url: '/profile' },
  { name: 'Jobs', url: '/jobs' },
  { name: 'Admin', url: '/admin_lobby' },
] as const

function isActive(pathname: string, url: string) {
  if (url === '/') return pathname === '/'
  if (url === '/admin_lobby') {
    return pathname === '/admin_lobby' || pathname === '/admin-lobby'
  }
  return pathname === url || pathname.startsWith(`${url}/`)
}

export default function AppsNav() {
  const pathname = usePathname() ?? '/'

  return (
    <nav className="apps-nav-pro" aria-label="Studio apps">
      <div className="apps-nav-pro__bar">
        <Link href="/" className="apps-nav-pro__brand">
          Espeezy Studios
        </Link>
        <ul className="apps-nav-pro__list">
          {navlinks.map((link) => {
            const active = isActive(pathname, link.url)
            return (
              <li key={link.url}>
                <Link
                  href={link.url}
                  className={`apps-nav-pro__link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
