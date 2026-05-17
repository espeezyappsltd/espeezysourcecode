'use client'

import { DevHubNavProvider } from './DevHubNavContext'
import { DevHubShellProvider, useDevHubShell } from './DevHubShellContext'
import { DevHubAdminSessionProvider } from './DevHubAdminSessionContext'
import { DevHubSidebar } from './DevHubSidebar'
import { DevHubTopBar } from './DevHubTopBar'
import { DevHubAdminChat } from './DevHubAdminChat'

function DevHubFrame({ children }: { children: React.ReactNode }) {
  const { mobileNavOpen, closeMobileNav } = useDevHubShell()

  return (
    <div className="dev-hub-frame page-fade">
      <DevHubTopBar />
      <button
        type="button"
        className={`dev-hub-sidebar-backdrop ${mobileNavOpen ? 'is-open' : ''}`}
        aria-label="Close navigation menu"
        onClick={closeMobileNav}
        tabIndex={mobileNavOpen ? 0 : -1}
      />
      <div className="dev-hub-frame-body">
        <DevHubSidebar />
        <main className="dev-hub-main" id="dev-hub-main">
          {children}
        </main>
      </div>
    </div>
  )
}

export function DevHubAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DevHubNavProvider>
      <DevHubShellProvider>
        <DevHubAdminSessionProvider>
          <div className="dev-hub-root dev-hub-root--shell">
            <div className="dev-hub-grid-bg" aria-hidden />
            <div className="dev-hub-glow dev-hub-glow--tl" aria-hidden />
            <div className="dev-hub-glow dev-hub-glow--br" aria-hidden />
            <DevHubFrame>{children}</DevHubFrame>
            <DevHubAdminChat />
          </div>
        </DevHubAdminSessionProvider>
      </DevHubShellProvider>
    </DevHubNavProvider>
  )
}
