'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sanitizeKanbanNextPath } from '@shared/app-url'
import { createClient } from '@/lib/supabase/client'

function KanbanSsoBridgeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  const target = useMemo(
    () => sanitizeKanbanNextPath(searchParams?.get('next') ?? null),
    [searchParams],
  )

  useEffect(() => {
    const run = async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')

        const supabase = createClient()

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main, #f4f6f8)',
        color: 'var(--text-main, #0f172a)',
        fontFamily: 'system-ui, sans-serif',
        padding: '1rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: '0.6rem', fontWeight: 800 }}>Signing you in…</h1>
        {error ? (
          <>
            <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>
            <button
              type="button"
              onClick={() => router.replace(`/login?next=${encodeURIComponent(target)}`)}
              style={{
                border: 'none',
                borderRadius: '10px',
                background: '#10b981',
                color: 'white',
                padding: '0.6rem 1rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Go to login
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--text-sub, #64748b)', fontSize: '0.9rem' }}>
            Redirecting to your workspace…
          </p>
        )}
      </div>
    </div>
  )
}

export default function KanbanSsoPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b' }}>Loading…</p>
        </div>
      }
    >
      <KanbanSsoBridgeContent />
    </Suspense>
  )
}
