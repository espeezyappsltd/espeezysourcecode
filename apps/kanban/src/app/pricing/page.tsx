'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import {
  getPlanCtaHref,
  getPlanCtaLabel,
  type PricingPlanId,
} from '@/lib/pricing/plan-routes'
import {
  LIFETIME_FEATURES,
  LIFETIME_PLAN_DESCRIPTION,
  LIFETIME_PLAN_NAME,
  PLATFORM_OPERATIONS_TAGLINE,
  PRICING_INTRO,
} from '@shared/platform-brand'
import { fetchLiveMetrics } from '@/services/launch'
import './pricing.css'
import { ReferralProgramPanel } from '@/components/ReferralProgramPanel'
import { useStoredReferralCode } from '@/hooks/useStoredReferralCode'
import { REFERRAL_PRO_DISCOUNT_PERCENT, REFERRAL_PROMO_TERMS } from '@shared/referrals'
import '@/components/referral-panel.css'

const LIFETIME_LIMIT = 100

const PLANS: ReadonlyArray<{
  id: PricingPlanId
  name: string
  price: string
  tag: string
  description: string
  features: readonly string[]
  featured?: boolean
}> = [
  {
    id: 'free',
    name: 'Espeezy Standard',
    price: 'Free',
    tag: 'Entry tier',
    description: 'Core collaboration tools with contribution records for every student.',
    features: ['Basic kanban workspace', 'Contribution proof records', '1GB storage included'],
  },
  {
    id: 'pro',
    name: 'Espeezy Pro',
    price: 'GBP 4.99 / month',
    tag: 'Best place to start',
    description: 'Better execution, deeper analytics, and a measurable academic edge.',
    features: ['Unlimited workspaces', 'AI Study Coach credits', '5GB storage included'],
    featured: true,
  },
  {
    id: 'premium',
    name: 'Espeezy Premium',
    price: 'GBP 14.99 / month',
    tag: 'Advanced workflows',
    description: 'For team leads who need deeper analytics and intervention tools.',
    features: ['Everything in Pro', 'Advanced AI access', '20GB storage included'],
  },
  {
    id: 'lifetime',
    name: LIFETIME_PLAN_NAME,
    price: 'GBP 149.00 one-time',
    tag: 'First 100 only',
    description: LIFETIME_PLAN_DESCRIPTION,
    features: [...LIFETIME_FEATURES],
  },
]

export default function PricingPage() {
  const supabase = useMemo(() => createSupabaseClient(), [])
  const [authReady, setAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [lifetimeSeatsUsed, setLifetimeSeatsUsed] = useState<number | null>(null)
  const storedReferralCode = useStoredReferralCode()

  const refreshLifetimeSeats = useCallback(() => {
    void fetchLiveMetrics().then((data) => {
      if (data && typeof data.lifetime_seats_used === 'number') {
        setLifetimeSeatsUsed(data.lifetime_seats_used)
      }
    })
  }, [])

  useEffect(() => {
    refreshLifetimeSeats()
    const interval = window.setInterval(refreshLifetimeSeats, 30_000)
    return () => window.clearInterval(interval)
  }, [refreshLifetimeSeats])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }
    let cancelled = false

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      const uid = session?.user?.id ?? null
      setIsAuthenticated(Boolean(uid))
      setUserId(uid)
      if (uid) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', uid)
          .maybeSingle()
        if (!cancelled) {
          setCurrentPlan(profile?.subscription_plan ?? 'free')
        }
      } else {
        setCurrentPlan(null)
      }
      setAuthReady(true)
    }

    void load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void load()
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  const lifetimeSoldOut =
    lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= LIFETIME_LIMIT
  const lifetimeSeatsLeft =
    lifetimeSeatsUsed !== null ? Math.max(0, LIFETIME_LIMIT - lifetimeSeatsUsed) : null

  const currentLabel = currentPlan
    ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
    : null

  return (
    <div className="pricing-page">
      <nav className="pricing-page__nav" aria-label="Pricing navigation">
        <Link href={isAuthenticated ? '/' : '/login'}>
          {isAuthenticated ? '← Back to dashboard' : '← Sign in'}
        </Link>
        {!authReady ? (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Loading…</span>
        ) : isAuthenticated ? (
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sub)' }}>
            Signed in{currentLabel ? ` · ${currentLabel} plan` : ''}
          </span>
        ) : null}
      </nav>

      <header className="pricing-page__hero">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Sparkles size={16} style={{ color: 'var(--brand)' }} aria-hidden />
          <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--brand)' }}>
            Plans & billing
          </span>
        </div>
        <h1>Choose the plan that fits your team</h1>
        <p>{PRICING_INTRO}</p>
        <p style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>{PLATFORM_OPERATIONS_TAGLINE}</p>
        {isAuthenticated && currentPlan && (
          <p className="pricing-page__current">
            Your current plan: <strong>{currentLabel}</strong>
          </p>
        )}
        {storedReferralCode && (
          <p className="pricing-page__referral-hint">
            Referral code <strong>{storedReferralCode}</strong> saved — {REFERRAL_PRO_DISCOUNT_PERCENT}% off Pro at checkout.{' '}
            <span className="pricing-page__referral-terms">{REFERRAL_PROMO_TERMS}</span>
          </p>
        )}
      </header>

      {isAuthenticated && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ReferralProgramPanel compact />
        </div>
      )}

      <div className="pricing-page__grid">
        {PLANS.map((product) => {
          const isLifetime = product.id === 'lifetime'
          const soldOut = isLifetime && lifetimeSoldOut
          const lifetimeBadge =
            isLifetime && lifetimeSeatsLeft !== null
              ? soldOut
                ? `Sold out (${LIFETIME_LIMIT}/${LIFETIME_LIMIT})`
                : `${lifetimeSeatsLeft} spots left`
              : null

          const href = getPlanCtaHref({
            plan: product.id,
            isAuthenticated,
            currentPlan,
            userId,
            lifetimeSoldOut: soldOut,
            referralCode: storedReferralCode,
          })
          const label = getPlanCtaLabel({
            plan: product.id,
            isAuthenticated,
            currentPlan,
            lifetimeSoldOut: soldOut,
          })
          const isCurrent =
            isAuthenticated && currentPlan && product.id !== 'free'
              ? currentPlan === product.id
              : isAuthenticated && product.id === 'free' && (!currentPlan || currentPlan === 'free')

          return (
            <article
              key={product.id}
              className={`pricing-card${product.featured ? ' pricing-card--featured' : ''}`}
            >
              {product.featured && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--brand)',
                    color: '#000',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  Recommended
                </div>
              )}
              <span className="pricing-card__badge">{product.tag}</span>
              <h2 className="pricing-card__name">{product.name}</h2>
              <div className="pricing-card__price">{product.price}</div>
              {lifetimeBadge && (
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: soldOut ? '#dc2626' : 'var(--brand)' }}>
                  {lifetimeBadge}
                </div>
              )}
              <p className="pricing-card__desc">{product.description}</p>
              <ul className="pricing-card__features">
                {product.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={15} color="var(--brand)" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {soldOut ? (
                <span className="pricing-card__cta pricing-card__cta--disabled">{label}</span>
              ) : (
                <Link
                  href={href}
                  className={`pricing-card__cta${product.featured ? ' pricing-card__cta--primary' : ''}`}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {label}
                  <ArrowRight size={16} aria-hidden />
                </Link>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
