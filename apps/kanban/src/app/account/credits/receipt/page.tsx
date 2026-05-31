'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

function ReceiptFrame() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('Missing receipt session.')
      return
    }
    void fetch(`/api/credits/fund-receipt?session_id=${encodeURIComponent(sessionId)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Receipt not found')
        return res.text()
      })
      .then(setHtml)
      .catch(() => setError('Receipt not found or not yet available.'))
  }, [sessionId])

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error}</p>
        <Link href="/account/credits" style={{ color: 'var(--brand)', fontWeight: 800 }}>
          Back to balance
        </Link>
      </div>
    )
  }

  if (!html) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
      </div>
    )
  }

  return (
    <iframe
      title="Fund receipt"
      srcDoc={html}
      style={{ width: '100%', minHeight: '100vh', border: 'none' }}
    />
  )
}

export default function CreditFundReceiptPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading receipt…</div>}>
      <ReceiptFrame />
    </Suspense>
  )
}
