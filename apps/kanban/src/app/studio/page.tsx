'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildStudiosSsoUrl } from '@shared/cross-app-auth'

export default function StudioBridgePage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const target = buildStudiosSsoUrl(
        session
          ? {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }
          : null,
      )

      window.location.replace(target)
    }

    void run().catch(() => {
      router.replace('/login?next=/studio')
    })
  }, [router])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--text-sub)',
      }}
    >
      Redirecting to Espeezy Studio...
    </main>
  )
}
