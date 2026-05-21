'use client'

import { useEffect, useState } from 'react'
import { buildKanbanAppSsoUrl } from '@shared/cross-app-auth'
import { getSupabaseClient } from '@/lib/supabase-client'

/** SSO URL to a path on kanban.espeezy.com for the signed-in user. */
export function useKanbanAppLink(nextPath = '/'): string {
  const [url, setUrl] = useState(() => buildKanbanAppSsoUrl(null, nextPath))

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUrl(
        buildKanbanAppSsoUrl(
          session
            ? {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }
            : null,
          nextPath,
        ),
      )
    })
  }, [nextPath])

  return url
}
