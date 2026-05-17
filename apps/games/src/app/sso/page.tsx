'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'
import { sanitizeNextPath } from '@shared/app-url'

function SsoBridgeContent() {
  const router = useRouter()

  // wrap the component using useSearchParams() in a <Suspense> boundary
  
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  const target = useMemo(
    () => sanitizeNextPath(searchParams.get('next')),
    [searchParams],
  )

  useEffect(() => {
    const run = async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')

        if (!accessToken || !refreshToken) {
          router.replace(`/login?next=${encodeURIComponent(target)}`)
          return
        }

        const supabase = getSupabaseClient()
        if (!supabase) {
          setError('Authentication is not configured.')
          return
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setError(error.message)
          return
        }

        router.replace(target)
      } catch {
        setError('Unable to complete single sign-on. Please sign in again.')
      }
    }

    void run()
  }, [router, searchParams, target])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>Connecting your session...</h1>
        {error ? (
          <>
            <p style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>
            <button
              type='button'
              onClick={() => router.replace(`/login?next=${encodeURIComponent(target)}`)}
              style={{ border: 'none', borderRadius: '10px', background: '#6366f1', color: 'white', padding: '0.6rem 1rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Go to Login
            </button>
          </>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Hold tight. You will be redirected automatically.</p>
        )}
      </div>
    </div>
  )
}

export default function SsoBridgePage() {
  return (
    <Suspense>
      <SsoBridgeContent />
    </Suspense>
  )
}
