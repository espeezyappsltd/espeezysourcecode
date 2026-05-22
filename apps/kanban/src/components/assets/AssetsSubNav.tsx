'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Coins, HardDrive, LayoutGrid, ShoppingBag } from 'lucide-react'

const LINKS: Array<{
  href: string
  label: string
  icon: typeof LayoutGrid
  exact?: boolean
}> = [
  { href: '/assets', label: 'Overview', icon: LayoutGrid, exact: true },
  { href: '/assets/storage', label: 'Storage & files', icon: HardDrive },
  { href: '/assets/credits', label: 'Credits', icon: Coins },
  { href: '/assets/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/assets/impact', label: 'Impact log', icon: Activity },
]

export function AssetsSubNav() {
  const pathname = usePathname()

  return (
    <nav className="assets-subnav" aria-label="Personal Arsenal sections">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={`assets-subnav__link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={16} strokeWidth={active ? 2.5 : 2} aria-hidden />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
