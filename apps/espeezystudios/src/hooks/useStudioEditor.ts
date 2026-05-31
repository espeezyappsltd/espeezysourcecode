'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

/** Signed-in users can edit studio page content (matches admin lobby gate). */
export function useStudioEditor() {
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      const user = data.user
      const allowed =
        Boolean(user) &&
        (user?.app_metadata?.role === 'admin' ||
          Boolean(user?.email?.endsWith('@espeezy.com')))
      setCanEdit(allowed)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  return { canEdit, loading }
}
