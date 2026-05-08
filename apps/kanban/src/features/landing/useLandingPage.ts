'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import { fetchPreregisterCount, submitPreregister } from '@/services/preregister'

export type WaitlistStatus = 'idle' | 'loading' | 'done' | 'error'
export type LoginStatus = 'idle' | 'loading' | 'error'

export function useLandingPage() {
  const user = useSupabaseUser()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<WaitlistStatus>('idle')
  const [registeredCount, setRegisteredCount] = useState<number | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle')
  const [authError, setAuthError] = useState('')

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

  async function handleLogout() {
    await supabase.auth.signOut().catch(() => undefined)
  }

  async function handleNotify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      return
    }

    setStatus('loading')

    try {
      const result = await submitPreregister({
        email: email.trim(),
        source: 'kanban-waitlist',
      })

      if (typeof result.count === 'number') {
        setRegisteredCount(result.count)
      }

      setStatus(result.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return {
    authError,
    email,
    handleLogin,
    handleLogout,
    handleNotify,
    loginEmail,
    loginPassword,
    loginStatus,
    registeredCount,
    setEmail,
    setLoginEmail,
    setLoginPassword,
    status,
    user,
  }
}
