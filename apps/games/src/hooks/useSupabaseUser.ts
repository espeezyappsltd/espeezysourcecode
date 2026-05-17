'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-client'

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return user
}
