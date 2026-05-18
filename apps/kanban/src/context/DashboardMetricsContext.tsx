'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useDashboardHomeData, type JoinRequest } from '@/components/dashboard/useDashboardHomeData'
import type { Group, Profile } from '@/types/database'

type DashboardMetricsContextValue = ReturnType<typeof useDashboardHomeData>

const DashboardMetricsContext = createContext<DashboardMetricsContextValue | null>(null)

export function DashboardMetricsProvider({
  groupId,
  profile,
  addToast,
  children,
}: {
  groupId: string
  profile: { id?: string | null; role?: string | null } | null | undefined
  addToast: (title: string, description: string, variant: 'success' | 'error' | 'info') => void
  children: ReactNode
}) {
  const value = useDashboardHomeData(groupId, profile, addToast)
  return <DashboardMetricsContext.Provider value={value}>{children}</DashboardMetricsContext.Provider>
}

export function useDashboardMetrics(): DashboardMetricsContextValue {
  const ctx = useContext(DashboardMetricsContext)
  if (!ctx) {
    throw new Error('useDashboardMetrics must be used within DashboardMetricsProvider')
  }
  return ctx
}

export type { JoinRequest, Group, Profile }
