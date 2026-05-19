'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CHECKOUT_SUCCESS_TEAM_NOTE } from '@shared/platform-brand'
import { CheckCircle2, ArrowRight, Sparkles, Crown, Zap, Star } from 'lucide-react'
import { getPlanKey } from '@/lib/stripe-payment-links'

// ── Confetti ──────────────────────────────────────────────────────────────────
const PALETTE: Record<string, string[]> = {
  pro:      ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#4f46e5'],
  premium:  ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#7c3aed'],
  lifetime: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#d97706'],
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; colour: string; rotation: number; rotV: number; alpha: number
}

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement | null>, palette: string[]) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: 200 }, () => ({
      x:        canvas.width / 2 + (Math.random() - 0.5) * 240,
      y:        canvas.height * 0.38,
      vx:       (Math.random() - 0.5) * 15,
      vy:       -(Math.random() * 12 + 5),
      size:     Math.random() * 9 + 4,
      colour:   palette[Math.floor(Math.random() * palette.length)],
      rotation: Math.random() * Math.PI * 2,
      rotV:     (Math.random() - 0.5) * 0.25,
      alpha:    1,
    }))

    let raf: number
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particles) {
        p.vy += 0.28
        p.vx *= 0.994
        p.x  += p.vx
        p.y  += p.vy
        p.rotation += p.rotV
        if (p.y > canvas.height * 0.72) p.alpha -= 0.022
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
  }, [canvasRef, palette])
}

// ── Per-tier content ──────────────────────────────────────────────────────────
const TIER_CONTENT = {
  pro: {
    label:     'Pro Plan Active',
    heading:   "You're in. Let's get to work.",
    subheading:'Your 14-day free trial has started - no charge until it ends.',
    body:      "Pro gives you the tools to show up better in group work: deeper analytics, AI Study Coach credits, and a verified contributor badge. Your trial runs for 14 days. Cancel any time before it ends and you won't pay a thing.",
    badge:     'Your Espeezy Pro trial is live',
    badgeSub:  'Full Pro access · Cancel any time',
    nextSteps: [
      'Log in at espeezy.com to activate your account',
      'Invite your group members - they stay on Free',
      'Check your contribution dashboard after your first session',
    ],
    icon:    <Zap size={44} color="white" fill="white" />,
    iconBg:  'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    accent:  '#6366f1',
    palette: 'pro' as const,
  },
  premium: {
    label:     'Premium Plan Active',
    heading:   'Premium unlocked.',
    subheading:'Your 14-day free trial is live - cancel any time before it ends.',
    body:      "You now have access to everything Espeezy Premium includes: advanced AI Study Coach, group health scores, academic integrity reports, and priority support. Use the trial to run at least one full project cycle and see the difference.",
    badge:     'Your Espeezy Premium trial is live',
    badgeSub:  'Full Premium access · Cancel any time',
    nextSteps: [
      'Log in at espeezy.com to activate your account',
      'Set up group health overview on your active workspace',
      'Explore the Academic Integrity report for your current project',
    ],
    icon:    <Star size={44} color="white" fill="white" />,
    iconBg:  'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    accent:  '#8b5cf6',
    palette: 'premium' as const,
  },
  lifetime: {
    label:     'Lifetime Scholar — seat claimed',
    heading:   'Welcome to the lifetime cohort.',
    subheading:"You've secured permanent Premium access. One payment. No renewal. Ever.",
    body:      "You're one of the first 100 lifetime members on Espeezy. Our 12-person platform team runs the backend that keeps your workspace online—you get every Premium feature, forever, plus a Lifetime Scholar badge and locked-in pricing. This is a one-time payment with nothing else to pay.",
    badge:     'Lifetime access — permanently unlocked',
    badgeSub:  'Lifetime Scholar · No renewal · Ever',
    nextSteps: [
      'Log in at espeezy.com to activate your account',
      'Your Lifetime Scholar badge will appear on your profile',
      'Every future Premium feature ships to you automatically',
    ],
    icon:    <Crown size={44} color="white" fill="white" />,
    iconBg:  'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    accent:  '#f59e0b',
    palette: 'lifetime' as const,
  },
}

// ── Main content ──────────────────────────────────────────────────────────────
function SuccessContent() {
  const searchParams = useSearchParams()
  const planKey  = getPlanKey(searchParams.get('plan'))
  const tier     = TIER_CONTENT[planKey]
  const palette  = PALETTE[tier.palette]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useConfetti(canvasRef, palette)

  return (
    <main style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Confetti layer */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }} />

      {/* Grid bg */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${tier.accent}0f 1px, transparent 1px)`, backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '620px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

        {/* Icon */}
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: tier.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 40px ${tier.accent}40` }}>
          {tier.icon}
        </div>

        {/* Label pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '5px 14px', background: `${tier.accent}14`, border: `1px solid ${tier.accent}30`, borderRadius: '100px' }}>
          <Sparkles size={12} color={tier.accent} />
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: tier.accent, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{tier.label}</span>
        </div>

        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1.05 }}>
            {tier.heading.split('.').map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {i === 0
                    ? <><span style={{ background: `linear-gradient(135deg, ${tier.accent}, ${tier.accent}bb)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{part}</span>.</>
                    : `${part}.`}
                </span>
              ) : part.trim() ? <span key={i}>{` ${part}`}</span> : null
            )}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 }}>
            {tier.subheading}
          </p>
        </div>

        {/* Body */}
        <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.7, maxWidth: '540px' }}>
          {tier.body}
        </p>

        {/* Confirmation badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center', padding: '1rem 1.75rem', background: `${tier.accent}0a`, border: `1px solid ${tier.accent}22`, borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#059669', fontSize: '0.9rem', fontWeight: 700 }}>
            <CheckCircle2 size={20} color="#059669" />
            {tier.badge}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{tier.badgeSub}</span>
        </div>

        {/* Next steps */}
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'left', background: '#f8fafc', border: '1px solid rgba(15,23,42,0.07)', borderRadius: '16px', padding: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Next steps</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tier.nextSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: tier.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 900, color: 'white', marginTop: '1px' }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500, lineHeight: 1.45 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%', maxWidth: '380px' }}>
          <a
            href="https://espeezy.com"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.2rem', borderRadius: '20px', background: `linear-gradient(135deg, ${tier.accent}, ${tier.accent}cc)`, color: '#ffffff', fontWeight: 950, fontSize: '1rem', textDecoration: 'none', boxShadow: `0 6px 24px ${tier.accent}35`, letterSpacing: '-0.01em' }}
          >
            Go to Espeezy <ArrowRight size={18} />
          </a>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.2rem', borderRadius: '20px', background: '#f8fafc', border: '1px solid rgba(15,23,42,0.08)', color: '#0f172a', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none' }}
          >
            Back to home
          </Link>
        </div>

        <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'rgba(15,23,42,0.45)', fontWeight: 600, lineHeight: 1.55, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
          {CHECKOUT_SUCCESS_TEAM_NOTE}
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(15,23,42,0.3)', fontWeight: 500 }}>
          A receipt has been sent to your email by Stripe. If you have any issues, contact{' '}
          <a href="mailto:support@espeezy.com" style={{ color: tier.accent, textDecoration: 'none', fontWeight: 700 }}>support@espeezy.com</a>.
        </p>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}
