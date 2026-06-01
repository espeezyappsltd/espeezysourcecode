'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import ProcessedDataNavigationLoader from '@shared/ProcessedDataNavigationLoader'
import { isStudiosProcessedDataRoute } from '@shared/processed-data-routes'
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
      <div className="studio-app-shell__main studio-app-shell__main--data-ready">
        <ProcessedDataNavigationLoader matchPath={isStudiosProcessedDataRoute}>
          {children}
        </ProcessedDataNavigationLoader>
      </div>
      <StudioBottomNav />
      <GlobalFooter />
    </div>
  )
}
