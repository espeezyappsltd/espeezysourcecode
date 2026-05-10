'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useSupabaseUser } from './useSupabaseUser'
import { fetchPreregisterCount, submitPreregister } from '@/services/preregister'

export type WaitlistStatus = 'idle' | 'loading' | 'done' | 'error'
export type LoginStatus = 'idle' | 'loading' | 'error' | 'signup-done'

export function useGamesLanding() {
  const user = useSupabaseUser()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<WaitlistStatus>('idle')
  const [registeredCount, setRegisteredCount] = useState<number | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle')
  const [authError, setAuthError] = useState('')

  // Fetch registration count
  useEffect(() => {
    let active = true

    const refresh = async () => {
      try {
        const count = await fetchPreregisterCount()
        if (active) {
          setRegisteredCount(typeof count === 'number' ? count : null)
        }
      } catch {
        if (active) {
          setRegisteredCount(null)
        }
      }
    }

    void refresh()

    const interval = setInterval(() => {
      void refresh()
    }, 30_000)

    const onFocus = () => {
      void refresh()
    }

    window.addEventListener('focus', onFocus)

    return () => {
      active = false
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // Clear auth errors when user logs in
  useEffect(() => {
    if (!user) {
      return
    }

    setAuthError('')
    setLoginStatus('idle')
    setLoginPassword('')
  }, [user])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!loginEmail.trim() || !loginPassword) {
      return
    }

    setLoginStatus('loading')
    setAuthError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      })

      if (error) {
        throw error
      }

      setLoginStatus('idle')
      setLoginPassword('')
    } catch {
      setLoginStatus('error')
      setAuthError('Login failed. Use the email/password from your Espeezy account.')
    }
  }

  async function handleCreateAccount() {
    if (!loginEmail.trim() || !loginPassword) return
    setLoginStatus('loading')
    setAuthError('')

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail.trim(),
        password: loginPassword,
        source: 'games-account-create',
      }),
    }).catch(() => null)

    if (!res) {
      setLoginStatus('error')
      setAuthError('Network error while creating account. Please try again.')
      return
    }

    const data = await res.json().catch(() => ({
      error: `Signup failed with status ${res.status}.`,
    }))
    if (!res.ok) {
      setLoginStatus('error')
      setAuthError(typeof data.error === 'string' ? data.error : 'Could not create account right now.')
      return
    }

    setLoginStatus('signup-done')
    setAuthError('Account created. Check your inbox for verification, then sign in.')
  }

  async function handleLogout() {
    await supabase.auth.signOut().catch(() => undefined)
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const result = await submitPreregister({
        email: email.trim(),
        source: 'games-waitlist',
      })
      if (result.ok) {
        setStatus('done')
        setEmail('')
      } else {
        setStatus('error')
        setAuthError(result.error ?? 'Failed to join waitlist')
      }
    } catch {
      setStatus('error')
      setAuthError('Network error while joining waitlist. Please try again in a moment.')
    }
  }

  return {
    authError,
    email,
    handleCreateAccount,
    handleLogin,
    handleLogout,
    handleNotify,
    loginEmail,
    loginPassword,
    loginStatus,
    registeredCount,
    setAuthError,
    setEmail,
    setLoginEmail,
    setLoginPassword,
    status,
    user,
  }
}
