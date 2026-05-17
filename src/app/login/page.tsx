import { Suspense } from 'react'
import { LoginForm } from '@/components/dev-hub/LoginForm'
import '@/app/dev-hub.css'

export default function LoginPage() {
  return (
    <div className="dev-hub-root">
      <div className="dev-hub-grid-bg" aria-hidden />
      <div className="dev-hub-glow dev-hub-glow--tl" aria-hidden />
      <div className="dev-hub-glow dev-hub-glow--br" aria-hidden />
      <Suspense fallback={<p style={{ textAlign: 'center', padding: '4rem' }}>Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
