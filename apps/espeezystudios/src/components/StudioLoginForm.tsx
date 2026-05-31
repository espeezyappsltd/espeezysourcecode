'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import StudiosLogo from '@/components/StudiosLogo'

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams?.toString() ?? ''

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) router.push('/')
    }
    void getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.push('/')
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [router])

  return (
    <main id="main-content" className="studio-auth-page">
      <div className="studio-auth-card">
        <StudiosLogo variant="login" className="studio-auth-card__logo" />
        <h1 className="studio-auth-card__title">Sign in to Studio</h1>
        <p className="studio-auth-card__desc">Access your dashboard, jobs, and client delivery tools.</p>
        <div className="studio-auth-card__actions">
          <a
            href={`/api/auth/signin?provider=github${query ? `&${query}` : ''}`}
            className="studio-auth-btn studio-auth-btn--github"
          >
            Continue with GitHub
          </a>
          <a
            href={`/api/auth/signin?provider=google${query ? `&${query}` : ''}`}
            className="studio-auth-btn studio-auth-btn--google"
          >
            Continue with Google
          </a>
        </div>
      </div>
    </main>
  )
}

export default function StudioLoginForm() {
  return (
    <Suspense fallback={<main id="main-content" className="studio-auth-page"><p className="studio-auth-card__desc">Loading…</p></main>}>
      <LoginFormContent />
    </Suspense>
  )
}
