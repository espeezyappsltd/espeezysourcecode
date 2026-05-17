'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type HubAdminSession = {
  username: string
  email: string
  admin_role: string
  display_name: string | null
}

type Ctx = {
  member: HubAdminSession | null
  loading: boolean
  refresh: () => Promise<void>
}

const DevHubAdminSessionContext = createContext<Ctx>({
  member: null,
  loading: true,
  refresh: async () => {},
})

export function DevHubAdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<HubAdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/hub/admin/me', { cache: 'no-store' })
      if (!res.ok) {
        setMember(null)
        return
      }
      const data = await res.json()
      setMember(data.member ?? null)
    } catch {
      setMember(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <DevHubAdminSessionContext.Provider value={{ member, loading, refresh }}>
      {children}
    </DevHubAdminSessionContext.Provider>
  )
}

export function useDevHubAdminSession() {
  return useContext(DevHubAdminSessionContext)
}
