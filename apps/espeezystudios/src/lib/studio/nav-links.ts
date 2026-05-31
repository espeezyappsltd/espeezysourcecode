import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Settings,
  Shield,
  ShoppingBag,
  User,
  Users,
} from 'lucide-react'

export type StudioNavLink = {
  name: string
  /** Shorter label for the mobile bottom bar */
  shortName?: string
  url: string
  icon: LucideIcon
  adminOnly?: boolean
  /** Primary destinations shown in the mobile bottom bar */
  bottomNav?: boolean
}

export const STUDIO_NAV_LINKS: StudioNavLink[] = [
  { name: 'Home', url: '/', icon: LayoutDashboard, bottomNav: true },
  { name: 'Jobs', url: '/jobs', icon: Briefcase, bottomNav: true },
  { name: 'Marketplace', shortName: 'Market', url: '/marketplace', icon: ShoppingBag, bottomNav: true },
  { name: 'Team', url: '/team', icon: Users },
  { name: 'Analytics', url: '/analytics', icon: BarChart3, bottomNav: true },
  { name: 'Profile', url: '/profile', icon: User },
  { name: 'Settings', url: '/settings', icon: Settings, bottomNav: true },
  { name: 'Admin', url: '/admin_lobby', icon: Shield, adminOnly: true },
]

export function isStudioNavActive(pathname: string, url: string): boolean {
  if (url === '/') return pathname === '/'
  if (url === '/admin_lobby') {
    return pathname === '/admin_lobby' || pathname === '/admin-lobby'
  }
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function filterStudioNavLinks(links: StudioNavLink[], isAdmin: boolean, adminReady: boolean) {
  return links.filter((link) => !link.adminOnly || (adminReady && isAdmin))
}
