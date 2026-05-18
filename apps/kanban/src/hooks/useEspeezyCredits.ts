'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'

export function useEspeezyCredits() {
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/credits', { credentials: 'include' })
      if (!res.ok) {
        setCredits(null)
        return
      }
      const data = (await res.json()) as { credits?: number }
      setCredits(typeof data.credits === 'number' ? data.credits : 0)
    } catch {
      setCredits(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    db.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    void refresh()
  }, [db, refresh])

  useEffect(() => {
    const onRefresh = () => void refresh()
    window.addEventListener('espeezy-credits-refresh', onRefresh)
    return () => window.removeEventListener('espeezy-credits-refresh', onRefresh)
  }, [refresh])

  useEffect(() => {
    if (!userId) return

    const channel = db
      .channel(`espeezy-credits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new as { espeezy_credits?: number }).espeezy_credits
          if (typeof next === 'number') setCredits(next)
        },
      )
      .subscribe()

    return () => {
      void db.removeChannel(channel)
    }
  }, [db, userId])

  return { credits, loading, refresh, setCredits }
}
