'use client'

import type { CSSProperties, ReactNode } from 'react'

type LoginAuthGateProps = {
  isChecking: boolean
  isRedirecting: boolean
  children: ReactNode
  variant?: 'dark' | 'light'
}

const spinKeyframes = `
@keyframes login-auth-spin {
  to { transform: rotate(360deg); }
}
@keyframes login-auth-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.92); }
  50% { opacity: 1; transform: scale(1); }
}
`

export function LoginAuthGate({
  isChecking,
  isRedirecting,
  children,
  variant = 'dark',
}: LoginAuthGateProps) {
  const isDark = variant === 'dark'
  const brand = isDark ? '#10b981' : '#6366f1'
  const showOverlay = isChecking || isRedirecting
  const message = isRedirecting ? 'Taking you in…' : 'Checking session…'

  const shellStyle: CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.25rem',
    background: isDark ? 'rgba(10, 10, 10, 0.92)' : 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(8px)',
    transition: 'opacity 0.28s ease, visibility 0.28s ease',
    opacity: showOverlay ? 1 : 0,
    visibility: showOverlay ? 'visible' : 'hidden',
    pointerEvents: showOverlay ? 'auto' : 'none',
  }

  const ringOuter: CSSProperties = {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    border: `2px solid ${isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)'}`,
    borderTopColor: brand,
    animation: 'login-auth-spin 0.75s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite',
  }

  const ringInner: CSSProperties = {
    position: 'absolute',
    width: '1.35rem',
    height: '1.35rem',
    borderRadius: '50%',
    background: brand,
    opacity: 0.85,
    animation: 'login-auth-pulse 1.2s ease-in-out infinite',
  }

  const contentStyle: CSSProperties = {
    opacity: showOverlay && isRedirecting ? 0 : 1,
    transition: 'opacity 0.28s ease',
    pointerEvents: showOverlay ? 'none' : 'auto',
  }

  const labelStyle: CSSProperties = {
    margin: 0,
    color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748b',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
  }

  return (
    <div style={shellStyle}>
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />
      <div
        role="status"
        aria-live="polite"
        aria-busy={showOverlay}
        aria-hidden={!showOverlay}
        style={overlayStyle}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={ringOuter} aria-hidden="true" />
          <div style={ringInner} aria-hidden="true" />
        </div>
        <p style={labelStyle}>{message}</p>
      </div>
      <div style={contentStyle}>{children}</div>
    </div>
  )
}
