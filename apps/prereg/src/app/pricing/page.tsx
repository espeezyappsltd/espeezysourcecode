'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, MotionConfig } from 'framer-motion'
import {
  Sparkles, ArrowRight, CheckCircle2,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { PLAN_PAYMENT_LINKS } from '@/lib/stripe-payment-links'
import { fetchLiveMetrics } from '@/services/launch'

const STRIPE_SUPPORT_PRODUCTS = [
  {
    name: 'Espeezy Standard',
    price: 'Free',
    tag: 'Entry Tier',
    href: '/',
    cta: 'Join Early Access',
    description: 'Core collaboration tools with a shared contribution record for every student.',
    features: ['Basic kanban workspace', 'Contribution proof records', '1GB storage included'],
  },
  {
    name: 'Espeezy Pro',
    price: 'GBP 4.99 / month',
    tag: 'Best Place To Start',
    href: PLAN_PAYMENT_LINKS.pro,
    cta: 'Choose Pro',
    description: 'The main paid plan for students who want better execution, deeper analytics, and a measurable academic edge.',
    features: ['Unlimited workspaces', 'AI Study Coach credits', '5GB storage included'],
  },
  {
    name: 'Espeezy Premium',
    price: 'GBP 14.99 / month',
    tag: 'Advanced Workflows',
    href: PLAN_PAYMENT_LINKS.premium,
    cta: 'Choose Premium',
    description: 'For team leads and heavier collaboration workflows that need deeper analytics and intervention tools.',
    features: ['Everything in Pro', 'Advanced AI access', '20GB storage included'],
  },
  {
    name: 'Premium Lifetime Access',
    price: 'GBP 149.00 one-time',
    tag: 'First 100 Only - Limited',
    href: PLAN_PAYMENT_LINKS.lifetime,
    cta: 'Claim Lifetime',
    description: 'Reserved for the first 100 early supporters only. One payment, permanent Premium access - no recurring billing, ever.',
    features: ['Everything in Premium', 'Founder badge', 'Legacy pricing protection'],
  },
] as const

const LIFETIME_LIMIT = 100

export default function PricingPage() {
  const [lifetimeSeatsUsed, setLifetimeSeatsUsed] = useState<number | null>(null)

  const refreshLifetimeSeats = useCallback(() => {
    fetchLiveMetrics().then((data) => {
      if (data && typeof data.lifetime_seats_used === 'number') {
        setLifetimeSeatsUsed(data.lifetime_seats_used)
      }
    })
  }, [])

  useEffect(() => {
    refreshLifetimeSeats()
    const interval = setInterval(refreshLifetimeSeats, 30_000)
    return () => clearInterval(interval)
  }, [refreshLifetimeSeats])

  const lifetimeSoldOut = lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= LIFETIME_LIMIT
  const lifetimeSeatsLeft = lifetimeSeatsUsed !== null ? Math.max(0, LIFETIME_LIMIT - lifetimeSeatsUsed) : null

  return (
    <MotionConfig reducedMotion="user">
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>
      {/* Dot-grid overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />
      {/* Gradient blobs */}
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav aria-label="Primary navigation" style={{ position: 'sticky', top: 0, zIndex: 1000, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1rem, 4vw, 2.5rem)', borderBottom: '1px solid rgba(15,23,42,0.07)', backdropFilter: 'blur(16px)', backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image src="/brand_logo2.svg" width={22} height={22} style={{ objectFit: 'contain' }} alt="" aria-hidden="true" priority />
          </div>
          <span style={{ fontWeight: 950, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.03em' }}>Espeezy</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/" style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(15,23,42,0.55)', textDecoration: 'none' }}>Pre-Register</Link>
          <Link href="/checkout" style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(15,23,42,0.55)', textDecoration: 'none' }}>Checkout</Link>
        </div>
      </nav>

      <section style={{ padding: 'clamp(4rem, 10vw, 7rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '7px 18px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '100px', marginBottom: '2rem' }}>
            <Sparkles size={14} color="var(--brand)" />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Flexible Pricing</span>
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, maxWidth: '800px', margin: '0 auto 1.5rem', color: '#0f172a' }}>
          Choose the plan that fits your{' '}
          <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            academic goals.
          </span>
        </motion.h1>
        <p style={{ color: '#64748b', maxWidth: '620px', margin: '0 auto 3rem', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', lineHeight: 1.65, fontWeight: 500 }}>
          From free collaboration tools to advanced AI-powered insights, we have a plan for every student and team.
        </p>

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          {STRIPE_SUPPORT_PRODUCTS.map((product) => {
            const isLifetime = product.name === 'Premium Lifetime Access'
            const soldOut = isLifetime && lifetimeSoldOut
            const lifetimeBadge = isLifetime && lifetimeSeatsLeft !== null
              ? (soldOut ? `Sold out (${LIFETIME_LIMIT}/${LIFETIME_LIMIT})` : `${lifetimeSeatsLeft} spots left`)
              : null

            return (
              <div key={product.name} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '2rem', background: '#ffffff', border: `1px solid ${product.name === 'Espeezy Pro' ? 'rgba(99,102,241,0.25)' : 'rgba(15,23,42,0.08)'}`, borderRadius: '24px', boxShadow: product.name === 'Espeezy Pro' ? '0 12px 40px rgba(99,102,241,0.08)' : '0 1px 4px rgba(15,23,42,0.05)', position: 'relative' }}>
                {product.name === 'Espeezy Pro' && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--brand)', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Recommended
                  </div>
                )}
                <div>
                  <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: product.name === 'Espeezy Pro' ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.05)', color: product.name === 'Espeezy Pro' ? 'var(--brand)' : '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>{product.tag}</div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 950, letterSpacing: '-0.03em', color: '#0f172a' }}>{product.name}</h3>
                  <div style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 950, color: '#0f172a' }}>{product.price}</div>
                  {lifetimeBadge && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', fontWeight: 700, color: soldOut ? '#dc2626' : '#059669' }}>
                      {lifetimeBadge}
                    </div>
                  )}
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6 }}>{product.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {product.features.map((feature) => (
                    <div key={feature} style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                {soldOut ? (
                  <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '12px', background: '#e2e8f0', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.9rem', fontWeight: 800 }}>
                    Offer Expired
                  </div>
                ) : (
                  <Link href={product.href} style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '12px', background: product.name === 'Espeezy Pro' ? 'var(--brand)' : '#f8fafc', border: product.name === 'Espeezy Pro' ? 'none' : '1px solid rgba(15,23,42,0.1)', color: product.name === 'Espeezy Pro' ? '#ffffff' : '#0f172a', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 800 }}>
                    {product.cta} <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(15,23,42,0.07)', padding: '2rem clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, background: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, var(--brand) 0%, #059669 100%)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={13} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#475569' }}>Espeezy</span>
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[['/', 'Home'], ['/pricing', 'Pricing'], ['/terms', 'Terms'], ['/privacy', 'Privacy']].map(([href, label]) => (
              <Link key={href} href={href} style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>{label}</Link>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: 0 }}>© {new Date().getFullYear()} Espeezy</p>
        </div>
      </footer>
    </div>
    </MotionConfig>
  )
}
