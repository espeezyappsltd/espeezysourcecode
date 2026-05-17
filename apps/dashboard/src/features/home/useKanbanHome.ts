'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import { fetchPreregisterCount } from '@/services/preregister'

export function useKanbanHome() {
  const user = useSupabaseUser()
  const [registeredCount, setRegisteredCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const count = await fetchPreregisterCount()
        if (active) setRegisteredCount(typeof count === 'number' ? count : null)
      } catch {
        if (active) setRegisteredCount(null)
      }
    }
    void refresh()
    const interval = setInterval(refresh, 30_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut().catch(() => undefined)
  }

  return { user, registeredCount, handleLogout }
}
