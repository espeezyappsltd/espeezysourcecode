'use client'

import { useEffect, useState } from 'react'
import { PLATFORM_APPS_FALLBACK, type PlatformApp } from '@shared/platform-apps'

export function usePlatformApps() {
  const [apps, setApps] = useState<PlatformApp[]>(PLATFORM_APPS_FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void fetch('/api/platform-apps', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { apps?: PlatformApp[] } | null) => {
        if (!mounted || !data?.apps?.length) return
        setApps(data.apps)
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { apps, loading }
}
