'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'

type UseSupabaseUserOptions = {
  requireUser?: boolean
  onUnauthenticated?: () => void
}

export function useSupabaseUser(options: UseSupabaseUserOptions = {}) {
  const { requireUser = false, onUnauthenticated } = options
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let active = true

    const handleUser = (nextUser: User | null) => {
      if (!active) return
      setUser(nextUser)
      if (!nextUser && requireUser) {
        onUnauthenticated?.()
      }
    }

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        handleUser(data.user)
      })
      .catch(() => {
        handleUser(null)
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [onUnauthenticated, requireUser])

  return user
}
