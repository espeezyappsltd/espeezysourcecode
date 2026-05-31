'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sanitizeNextPath } from '@shared/app-url'
import { supabase } from '@/lib/supabase-client'

function StudiosSsoBridgeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  const target = useMemo(
    () => sanitizeNextPath(searchParams?.get('next') ?? null, '/marketplace'),
    [searchParams],
  )

  useEffect(() => {
    const run = async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')

        if (!accessToken || !refreshToken) {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session) {
            router.replace(target)
            router.refresh()
            return
          }
          router.replace(`/login?next=${encodeURIComponent(target)}`)
          return
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          setError(sessionError.message)
          return
        }

        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        router.replace(target)
        router.refresh()
      } catch {
        setError('Unable to complete sign-in. Please try again.')
      }
    }

    void run()
  }, [router, target])

  return (
    <div className="studio-sso-bridge">
      <div className="studio-sso-bridge__card">
        <h1>Signing you in…</h1>
        {error ? (
          <>
            <p className="studio-sso-bridge__error">{error}</p>
            <button type="button" onClick={() => router.replace(`/login?next=${encodeURIComponent(target)}`)}>
              Go to login
            </button>
          </>
        ) : (
          <p>Redirecting to Espeezy Studio…</p>
        )}
      </div>
    </div>
  )
}

export default function StudiosSsoPage() {
  return (
    <Suspense fallback={<div className="studio-sso-bridge"><p>Loading…</p></div>}>
      <StudiosSsoBridgeContent />
    </Suspense>
  )
}
