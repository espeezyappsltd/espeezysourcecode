'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { buildGamesProfileSsoUrl } from '@shared/cross-app-auth'
import { createClient } from '@/lib/supabase/client'

/**
 * SSO URL to the signed-in user's games.espeezy.com profile (or games login).
 */
export function useGamesProfileLink(): string {
  const [url, setUrl] = useState(() => buildGamesProfileSsoUrl(null))

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const session = data.session
      setUrl(
        buildGamesProfileSsoUrl(
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
