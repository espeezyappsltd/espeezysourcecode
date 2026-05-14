'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { fetchLiveMetrics } from '@/services/launch'

// ── Lightweight canvas confetti ──────────────────────────────────────────────
const COLOURS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#a855f7']

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; colour: string; rotation: number; rotV: number; alpha: number
}

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: 180 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 10 + 4),
      size: Math.random() * 8 + 4,
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      alpha: 1,
    }))

    let raf: number
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particles) {
        p.vy += 0.25          // gravity
        p.vx *= 0.995         // air resistance
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotV
        if (p.y > canvas.height * 0.7) p.alpha -= 0.025
        if (p.alpha > 0) {
          alive = true
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.fillStyle = p.colour
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          ctx.restore()
        }
      }
      if (alive) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [canvasRef])
}

// ── Main content ─────────────────────────────────────────────────────────────
function DonationSuccessContent() {
  const searchParams = useSearchParams()
  const [amount, setAmount] = useState<string | null>(null)
  const [metrics, setMetrics] = useState({ donation_total_cents: 0, donation_supporters_count: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useConfetti(canvasRef)

  useEffect(() => {
    const a = searchParams.get('amount')
    if (a) setAmount(a)
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem('espeezy_donation_completed_at', String(Date.now()))
  }, [searchParams])

  useEffect(() => {
    let active = true

    const refreshMetrics = async () => {
      try {
        const data = await fetchLiveMetrics()
        if (!data) return
        if (!active) return
        setMetrics({
          donation_total_cents: typeof data.donation_total_cents === 'number' ? data.donation_total_cents : 0,
          donation_supporters_count: typeof data.donation_supporters_count === 'number'
            ? data.donation_supporters_count
            : (typeof data.donation_count === 'number' ? data.donation_count : 0),
        })
      } catch {
        // Leave existing totals in place when metrics are temporarily unavailable.
      }
    }

    refreshMetrics()
    const timer = window.setInterval(refreshMetrics, 30_000)
    window.addEventListener('focus', refreshMetrics)

    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('focus', refreshMetrics)
    }
  }, [])

  const totalRaised = (metrics.donation_total_cents / 100).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* confetti layer */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }} />

      {/* subtle grid bg */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

        {/* icon */}
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 40px rgba(99,102,241,0.25)' }}>
          <Heart size={44} color="white" fill="white" />
        </div>

        {/* heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#6366f1', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
            <Sparkles size={14} /> Donation Confirmed
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1.1 }}>
            Thank you for{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              supporting Espeezy.
            </span>
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.6 }}>
            {amount
              ? `Your £${amount} contribution goes directly toward keeping Espeezy free and accessible for students everywhere.`
              : 'Your contribution goes directly toward keeping Espeezy free and accessible for students everywhere.'}
          </p>
        </div>

        {/* stripe badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '16px', color: '#059669', fontSize: '0.9rem', fontWeight: 700 }}>
          <CheckCircle2 size={20} />
          Payment processed securely via Stripe
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', width: '100%', maxWidth: '420px' }}>
          <div style={{ padding: '0.9rem 1rem', borderRadius: '16px', background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.08)' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 950, color: '#0f172a' }}>{totalRaised}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '4px' }}>Raised so far</div>
          </div>
          <div style={{ padding: '0.9rem 1rem', borderRadius: '16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.16)' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 950, color: '#059669' }}>{metrics.donation_supporters_count.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '4px' }}>Supporters</div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '360px' }}>
          <Link href="https://espeezy.com" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.25rem', borderRadius: '24px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#ffffff', fontWeight: 950, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
            Back to Espeezy <ArrowRight size={18} />
          </Link>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', borderRadius: '24px', background: '#f8fafc', border: '1px solid rgba(15,23,42,0.08)', color: '#0f172a', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none' }}>
            Register for early access
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
