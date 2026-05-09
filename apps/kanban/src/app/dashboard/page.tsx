'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      if (!user) {
        router.replace('/login')
      }
    }

    getSession()

    // Listen for auth state changes (session updates, sign outs, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        router.replace('/login')
      } else if (session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  async function handleLogout() {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
    }
    // Router push handled by auth state listener
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        textAlign: 'center',
      }}>
        {/* Logo/Header */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>espeezy</span>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            background: '#10b981',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>kanban</span>
        </div>

        {/* Coming Soon Content */}
        <h1 style={{
          color: '#fff',
          fontSize: '2rem',
          fontWeight: 800,
          margin: '0 0 1rem',
          letterSpacing: '-0.03em',
        }}>
          Coming Soon
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '1rem',
          margin: '0 0 2.5rem',
          lineHeight: 1.6,
        }}>
          We're building something amazing for you. Stay tuned for the full Kanban experience.
        </p>

        {/* User Info */}
        <div style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 0.5rem',
          }}>Account</p>
          <p style={{
            color: '#6ee7b7',
            fontSize: '0.95rem',
            fontWeight: 600,
            margin: 0,
            wordBreak: 'break-all',
          }}>
            {user.email}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={signingOut}
          style={{
            width: '100%',
            padding: '0.875rem 1.25rem',
            borderRadius: '12px',
            border: 'none',
            background: '#10b981',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: signingOut ? 'not-allowed' : 'pointer',
            opacity: signingOut ? 0.7 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!signingOut) {
              (e.target as HTMLButtonElement).style.background = '#059669'
              ;(e.target as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(16,185,129,0.4)'
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#10b981'
            ;(e.target as HTMLButtonElement).style.boxShadow = 'none'
          }}
        >
          {signingOut ? 'Signing out...' : 'Log Out'}
        </button>
      </div>
    </div>
  )
}
