'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export type SessionUserState = {
  user: User | null
  /** True until the first session probe resolves. */
  loading: boolean
}

/**
 * Cross-app current-user probe for marketing nav/hero/footer surfaces.
 * Pass the app's browser Supabase client; returns the signed-in user (or null)
 * and a `loading` flag so CTAs can avoid flashing the wrong state on first paint.
 */
export function useSessionUser(supabase: SupabaseClient | null): SessionUserState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true

    // Some apps expose a Proxy client that throws when Supabase env vars are
    // missing; never let that crash the surrounding marketing UI.
    try {
      void supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!active) return
          setUser(data.session?.user ?? null)
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false)
        })

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => {
        active = false
        sub.subscription.unsubscribe()
      }
    } catch {
      setLoading(false)
      return () => {
        active = false
      }
    }
  }, [supabase])

  return { user, loading }
}
