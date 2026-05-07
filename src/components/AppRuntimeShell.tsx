'use client'

import { usePathname } from 'next/navigation'
import ClientShell from './ClientShell'
import { NotificationProvider } from './NotificationProvider'
import PWARegistry from './PWARegistry'
import SessionGuard from './SessionGuard'
import ToasterModeManager from './ToasterModeManager'
import { RealtimeProvider } from '@/lib/realtime-provider'

const PREREG_PATHS = new Set(['/', '/preregister'])

export default function AppRuntimeShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  if (pathname && PREREG_PATHS.has(pathname)) {
    return <>{children}</>
  }

  return (
    <RealtimeProvider>
      <ToasterModeManager />
      <NotificationProvider>
        <PWARegistry />
        {children}
        <ClientShell />
        <SessionGuard />
      </NotificationProvider>
    </RealtimeProvider>
  )
}
