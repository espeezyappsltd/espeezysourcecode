import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function GamesLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading…</div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}
