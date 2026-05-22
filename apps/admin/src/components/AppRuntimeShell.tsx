'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import ClientShell from './ClientShell'
import { AdminThemeScope } from './console/AdminThemeScope'
import { NotificationProvider } from './NotificationProvider'
import PWARegistry from './PWARegistry'
import ToasterModeManager from './ToasterModeManager'

const SessionGuard = dynamic(() => import('./SessionGuard'), { ssr: false })
const RealtimeProvider = dynamic(
  () => import('@/lib/realtime-provider').then((module) => module.RealtimeProvider),
  { ssr: false },
)

const PREREG_PATHS = new Set(['/', '/preregister'])

export default function AppRuntimeShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  if (pathname && PREREG_PATHS.has(pathname)) {
    return (
      <>
        <AdminThemeScope />
        {children}
      </>
    )
  }

  return (
    <RealtimeProvider>
      <AdminThemeScope />
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
