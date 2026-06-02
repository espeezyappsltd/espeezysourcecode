'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { buildStudiosSsoUrl, STUDIOS_MARKETPLACE_PATH } from '@shared/cross-app-auth'
import { createClient } from '@/lib/supabase/client'

/** SSO URL to Espeezy Studios marketplace hub (Premium feature). */
export function useStudioLink(nextPath: string = STUDIOS_MARKETPLACE_PATH): string {
  const [url, setUrl] = useState(() => buildStudiosSsoUrl(null, nextPath))

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const session = data.session
      setUrl(
        buildStudiosSsoUrl(
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
