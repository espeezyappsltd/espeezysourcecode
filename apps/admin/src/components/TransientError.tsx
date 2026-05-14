'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

export default function TransientError({ message, type = 'error' }: { message: string, type?: 'error' | 'success' }) {
  const [visible, setVisible] = useState(!!message)

  useEffect(() => {
    if (!message) return

    const openToast = () => setVisible(true)
    const timer = window.setTimeout(() => {
      setVisible(false)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        if (url.searchParams.has('error')) {
          url.searchParams.delete('error')
          window.history.replaceState({}, document.title, url.toString())
        }
      }
    }, 5000)

    void Promise.resolve().then(openToast)
    return () => window.clearTimeout(timer)
  }, [message])

  if (!visible || !message) return null

  const isSuccess = type === 'success'
  const borderColor = isSuccess ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)'
  const backgroundColor = isSuccess ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'

  return (
    <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', width: '100%', maxWidth: '800px', animation: 'fadeIn 0.3s ease-out', borderRadius: '18px', padding: '1rem 1.25rem', background: backgroundColor, border: `1px solid ${borderColor}`, color: isSuccess ? 'var(--success)' : 'var(--error)' }}>
      <AlertCircle size={16} color={isSuccess ? 'var(--success)' : 'var(--error)'} />
      <span>{message}</span>
    </div>
  )
}
