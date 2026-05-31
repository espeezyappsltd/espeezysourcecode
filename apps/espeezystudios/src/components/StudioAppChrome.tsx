'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AppsNav from './AppsNav'
import StudioBottomNav from './StudioBottomNav'
import GlobalFooter from './GlobalFooter'

const MINIMAL_CHROME_PATHS = new Set(['/login', '/sso'])

function usesMinimalChrome(pathname: string) {
  return MINIMAL_CHROME_PATHS.has(pathname)
}

export default function StudioAppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const minimal = usesMinimalChrome(pathname)

  if (minimal) {
    return (
      <div className="studio-app-shell studio-app-shell--minimal">
        <div className="studio-app-shell__main">{children}</div>
      </div>
    )
  }

  return (
    <div className="studio-app-shell">
      <AppsNav />
      <div className="studio-app-shell__main">{children}</div>
      <StudioBottomNav />
      <GlobalFooter />
    </div>
  )
}
