'use client'

import { useEffect, useState } from 'react'
import { buildKanbanWorkspaceSsoUrl } from '@shared/cross-app-auth'
import { getSupabaseClient } from '@/lib/supabase-client'

/** SSO URL to kanban.espeezy.com workspace for the signed-in user. */
export function useKanbanWorkspaceLink(): string {
  const [url, setUrl] = useState(() => buildKanbanWorkspaceSsoUrl(null))

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUrl(
        buildKanbanWorkspaceSsoUrl(
          session
            ? {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }
            : null,
        ),
      )
    })
  }, [])

  return url
}
