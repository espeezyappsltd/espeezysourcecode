'use client'

import type { CSSProperties, ReactNode } from 'react'

type LoginAuthGateProps = {
  isChecking: boolean
  isRedirecting: boolean
  children: ReactNode
  /** Visual theme for the brief session probe state */
  variant?: 'dark' | 'light'
}

const spinKeyframes = `@keyframes login-auth-spin { to { transform: rotate(360deg); } }`

export function LoginAuthGate({
  isChecking,
  isRedirecting,
  children,
  variant = 'dark',
}: LoginAuthGateProps) {
  if (!isChecking && !isRedirecting) {
    return <>{children}</>
  }

  const isDark = variant === 'dark'
  const message = isRedirecting ? 'Redirecting…' : 'Checking session…'

  const shellStyle: CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    background: isDark ? '#0a0a0a' : '#ffffff',
    color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.9rem',
  }

  const spinnerStyle: CSSProperties = {
    width: '2rem',
    height: '2rem',
    border: `2px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)'}`,
    borderTopColor: isDark ? '#10b981' : '#6366f1',
    borderRadius: '50%',
    animation: 'login-auth-spin 0.7s linear infinite',
  }

  return (
    <div role="status" aria-live="polite" aria-busy="true" style={shellStyle}>
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />
      <div aria-hidden="true" style={spinnerStyle} />
      <span>{message}</span>
    </div>
  )
}
