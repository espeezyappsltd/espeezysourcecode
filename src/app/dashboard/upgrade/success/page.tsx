'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, ArrowRight, Sparkles, PartyPopper, Star, Users, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

const PERKS = [
  { icon: <Star size={15} />, label: 'Verified Scholar badge added to your profile' },
  { icon: <Zap size={15} />, label: 'AI Study Coach activated — start your first session' },
  { icon: <Users size={15} />, label: 'Unlimited group workspaces unlocked' },
]

function SuccessContent() {
  const router = useRouter()

  useEffect(() => {
    // Burst of celebration confetti
    const end = Date.now() + 3500
    const colors = ['#10b981', '#34d399', '#ffffff', '#6ee7b7', '#a7f3d0']
    const rand = (a: number, b: number) => Math.random() * (b - a) + a

    const fire = (opts: confetti.Options) =>
      confetti({ particleCount: 40, spread: 100, ticks: 80, zIndex: 9999, colors, ...opts })

    const id = setInterval(() => {
      const left = end - Date.now()
      if (left <= 0) { clearInterval(id); return }
      const ratio = left / 3500
      fire({ particleCount: Math.round(60 * ratio), origin: { x: rand(0.05, 0.25), y: -0.1 } })
      fire({ particleCount: Math.round(60 * ratio), origin: { x: rand(0.75, 0.95), y: -0.1 } })
    }, 220)

    // One big pop in the centre immediately
    confetti({ particleCount: 120, spread: 180, startVelocity: 55, origin: { x: 0.5, y: 0.1 }, colors, zIndex: 9999 })

    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #06100d 0%, #0a0a0a 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '40px',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.08)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 14 }}
          style={{
            width: '96px',
            height: '96px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.08) 100%)',
            borderRadius: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 0 48px rgba(16,185,129,0.3)',
            border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <PartyPopper size={44} color="#10b981" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '5px 14px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', marginBottom: '1.25rem' }}>
            <Sparkles size={12} color="#10b981" />
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.14em' }}>You&apos;re in</span>
          </div>

          <h1 style={{ margin: '0 0 0.75rem', fontSize: '2.2rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Welcome to the<br />
            <span style={{ color: '#10b981' }}>Scholar Community.</span>
          </h1>
          <p style={{ margin: '0 0 2rem', color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500, lineHeight: 1.6 }}>
            Your upgrade is confirmed and your account has been instantly upgraded. Time to do great work.
          </p>
        </motion.div>

        {/* Perks list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '18px', padding: '1.25rem 1.5rem', marginBottom: '2rem', textAlign: 'left' }}
        >
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Activated now</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {PERKS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}
              >
                {p.icon}
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{p.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/dashboard" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#0a0a0a',
            textDecoration: 'none',
            padding: '1.1rem',
            borderRadius: '16px',
            fontWeight: 950,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            fontSize: '0.95rem',
            boxShadow: '0 10px 32px rgba(16,185,129,0.3)',
          }}>
            Go to Dashboard <ArrowRight size={18} />
          </Link>

          <button
            onClick={() => router.push('/dashboard/invoice')}
            style={{
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '1rem',
              borderRadius: '16px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <FileText size={16} /> Download receipt
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontWeight: 600 }}>
          <span style={{ width: '5px', height: '5px', background: '#10b981', borderRadius: '50%' }} />
          Confirmed via Stripe · espeezy.com
        </div>
      </motion.div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

