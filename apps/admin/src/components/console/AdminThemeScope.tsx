'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const ADMIN_DARK_CLASS = 'admin-theme-dark'

function isAdminDarkRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/login' || pathname.startsWith('/admin')
}

export function AdminThemeScope() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    const on = isAdminDarkRoute(pathname)
    if (on) root.classList.add(ADMIN_DARK_CLASS)
    else root.classList.remove(ADMIN_DARK_CLASS)
    return () => root.classList.remove(ADMIN_DARK_CLASS)
  }, [pathname])

  return null
}
