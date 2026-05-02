'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

function DonationSuccessContent() {
  const searchParams = useSearchParams()
  const [amount, setAmount] = useState<string | null>(null)

  useEffect(() => {
    const a = searchParams.get('amount')
    if (a) setAmount(a)
  }, [searchParams])

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'inherit'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem'
      }}>
        {/* Icon */}
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand, #10b981) 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 60px rgba(16, 185, 129, 0.3)'
        }}>
          <Heart size={44} color="white" fill="white" />
        </div>

        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--brand, #10b981)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            <Sparkles size={14} /> Donation Confirmed
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 950,
            letterSpacing: '-0.04em',
            color: 'white',
            lineHeight: 1.1
          }}>
            Thank you for{' '}
            <span style={{ color: 'var(--brand, #10b981)' }}>supporting Espeezy.</span>
          </h1>
          <p style={{
            margin: 0,
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1.1rem',
            fontWeight: 500,
            lineHeight: 1.6
          }}>
            {amount
              ? `Your $${amount} contribution goes directly toward keeping Espeezy free and accessible for students everywhere.`
              : 'Your contribution goes directly toward keeping Espeezy free and accessible for students everywhere.'}
          </p>
        </div>

        {/* Confirmation badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '16px',
          color: 'var(--brand, #10b981)',
          fontSize: '0.9rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={20} />
          Payment processed securely via Stripe
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '360px' }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1.25rem',
            borderRadius: '24px',
            background: 'var(--brand, #10b981)',
            color: '#0a0a0a',
            fontWeight: 950,
            fontSize: '1rem',
            textDecoration: 'none',
            transition: 'opacity 0.2s'
          }}>
            Back to Espeezy <ArrowRight size={18} />
          </Link>
          <Link href="/preregister" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 800,
            fontSize: '0.95rem',
            textDecoration: 'none'
          }}>
            Create your free account
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={null}>
      <DonationSuccessContent />
    </Suspense>
  )
}

