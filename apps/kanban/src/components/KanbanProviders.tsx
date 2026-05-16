'use client'

import { ConnectivityProvider } from '@/context/ConnectivityContext'
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider'
import { CentralLoadingProvider } from '@shared/CentralLoadingProvider'

export function KanbanProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConnectivityProvider>
      <GlobalLoadingProvider>
        <CentralLoadingProvider>{children}</CentralLoadingProvider>
      </GlobalLoadingProvider>
    </ConnectivityProvider>
  )
}
