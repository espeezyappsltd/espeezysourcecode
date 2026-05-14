'use client'
 
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
 
  return (
    <div className="dashboard-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <AlertCircle size={48} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        A system-level pipeline error occurred. We&apos;ve logged this internally.
      </p>
      <button
        style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}
        className="btn btn-primary"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}
