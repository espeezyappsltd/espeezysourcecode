'use client'

import { useState, useEffect } from 'react'
import { Shield, Sparkles, CheckCircle2, ArrowRight, Loader2, Key, Zap, Crown, Rocket } from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getCountFromServer } from 'firebase/firestore'
import { onAuthStateChanged, User } from 'firebase/auth'
import TransientError from '@/components/TransientError'

interface PricingSectionProps {
  showTitle?: boolean
  isLanding?: boolean
}

export default function PricingSection({ showTitle = true, isLanding = false }: PricingSectionProps) {
  const [error, setError] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [lifetimeSeatsUsed, setLifetimeSeatsUsed] = useState<number | null>(null)
  const [coupon, setCoupon] = useState('')
  const [discountActive, setDiscountActive] = useState(false)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const lifetimeQuery = query(collection(db, 'profiles'), where('subscription_plan', '==', 'lifetime'))
        const lifetimeSnapshot = await getCountFromServer(lifetimeQuery)

        setLifetimeSeatsUsed(lifetimeSnapshot.data().count || 0)
      } catch (err) {
        console.error('Error fetching counts:', err)
        // Fallback to mock if it fails during migration
        setLifetimeSeatsUsed(12)
      }
    }
    fetchCounts()
  }, [])

  const handleApplyCoupon = () => {
    if (!coupon) return
    setValidatingCoupon(true)

    // Simulate high-performance validation logic
    setTimeout(() => {
      if (coupon.toUpperCase() === 'ELITE30' || coupon.toUpperCase() === 'STUDENT30') {
        setDiscountActive(true)
        setError(null)
      } else {
        setError('Invalid or expired clearance code.')
        setDiscountActive(false)
      }
      setValidatingCoupon(false)
    }, 600)
  }

  const handleCheckout = async (plan: 'pro' | 'premium' | 'lifetime') => {
    setError(null)
    setLoadingPlan(plan)

    try {
      if (!currentUser) {
        // Redirect to preregister/login
        const returnUrl = `/checkout?plan=${plan}${discountActive ? `&coupon=${coupon}` : ''}`
        window.location.href = `/preregister?redirect=${encodeURIComponent(returnUrl)}`
        return
      }

      // Route through pre-checkout interstitial
      const params = new URLSearchParams({ plan, uid: currentUser.uid })
      if (discountActive && coupon) params.set('coupon', coupon)
      window.location.href = `/checkout?${params.toString()}`
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout initiation failed.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>

      {showTitle && (
        <div style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: isLanding ? 'center' : 'left' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isLanding ? 'center' : 'flex-start',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--brand)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            <Sparkles size={18} /> Invest in your future
          </div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1, fontWeight: 950, letterSpacing: '-0.05em', color: 'white', margin: 0 }}>
            Premium tools. <span style={{ color: 'var(--brand)' }}>Student-friendly prices.</span>
          </h2>
          <p style={{
            maxWidth: '720px',
            margin: isLanding ? '0 auto' : '0',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1.2rem',
            fontWeight: 500,
            lineHeight: 1.5
          }}>
            Espeezy is built for students, by students. We keep our costs low so you can have world-class collaboration infrastructure without breaking the bank.
          </p>
        </div>
      )}

      {/* ── DISCOUNT HUB ────────────────────────────────────────── */}
      <div style={{
        padding: '1.5rem 2rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        maxWidth: '800px',
        margin: isLanding ? '0 auto' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: discountActive ? 'var(--brand)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: discountActive ? 'black' : 'rgba(255,255,255,0.4)', transition: '0.3s' }}>
            <Key size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 950, fontSize: '0.9rem', color: discountActive ? 'var(--brand)' : 'white' }}>
              {discountActive ? '30% STUDENT DISCOUNT ACTIVE' : 'Student Discount Code'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              {discountActive ? 'Your discount is applied to all monthly plans.' : 'Use "STUDENT30" for 30% off any monthly subscription.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '300px' }}>
          <input
            type="text"
            placeholder="STUDENT30"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            disabled={discountActive}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 800,
              outline: 'none',
              textTransform: 'uppercase'
            }}
          />
          <button
            onClick={handleApplyCoupon}
            disabled={discountActive || validatingCoupon || !coupon}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              fontWeight: 950,
              fontSize: '0.8rem',
              background: discountActive ? 'var(--success)' : 'var(--brand)',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {validatingCoupon ? <Loader2 className="animate-spin" size={16} /> : discountActive ? 'APPLIED' : 'APPLY'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

        {/* STARTER TIER */}
        <div style={{
          padding: '3.5rem 2.5rem',
          borderRadius: '40px',
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.4s ease',
          position: 'relative'
        }} className="premium-pricing-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={28} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, color: 'white' }}>Starter</h2>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Basic Access</p>
              </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '2.5rem' }}>
                <span style={{ fontSize: '4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>£0</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.9rem' }}>/forever</span>
              </div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[
                  'Unlimited collaborative projects',
                  'Basic task tracking protocols',
                  'Public peer-networking access',
                  'Standard AI synthesis usage',
                  'Real-time document sync',
                  'Up to 5MB storage per project'
                ].map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                    <CheckCircle2 size={16} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: '3px' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            style={{
              width: '100%',
              padding: '1.25rem',
              borderRadius: '24px',
              fontSize: '0.95rem',
              fontWeight: 950,
              background: 'rgba(255,255,255,0.03)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer'
            }}
            onClick={() => window.location.href = '/preregister'}
          >
            Get Started Free
          </button>
        </div>

        {/* PRO TIER */}
        <div style={{
          padding: '3.5rem 2.5rem',
          borderRadius: '40px',
          background: 'rgba(16, 185, 129, 0.02)',
          border: '2px solid var(--brand)',
          backdropFilter: 'blur(30px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.4s ease',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }} className="premium-pricing-card popular-tier">
          <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 12px', background: 'var(--brand)', color: '#0a0a0a', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 950, letterSpacing: '1px' }}>RECOMMENDED</div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--brand)', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Rocket size={28} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, color: 'white' }}>Pro Scholar</h2>
                <p style={{ margin: 0, color: 'var(--brand)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Advanced Analytics</p>
              </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                {discountActive ? (
                  <>
                    <span style={{ fontSize: '4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>£3.49</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '1.5rem', textDecoration: 'line-through' }}>£4.99</span>
                  </>
                ) : (
                  <span style={{ fontSize: '4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>£4.99</span>
                )}
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.9rem' }}>/mo</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem', fontWeight: 500 }}>
                Unlock the full technical potential of your study team with priority AI feedback, unlimited projects, and deep contribution analytics.
              </p>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  'Priority AI Synthesis usage',
                  'Unlimited active project hubs',
                  'Advanced contribution heatmaps',
                  'Export-ready research reports',
                  '1GB encrypted cloud storage',
                  'Priority academic support',
                  'Early access to new modules'
                ].map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '3px' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            style={{
              width: '100%',
              padding: '1.25rem',
              borderRadius: '24px',
              fontSize: '1rem',
              fontWeight: 950,
              background: 'var(--brand)',
              color: '#0a0a0a',
              border: 'none',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
              cursor: 'pointer'
            }}
            onClick={() => handleCheckout('pro')}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === 'pro' ? 'SYNCING...' : `Upgrade to Pro`}
          </button>
        </div>

        {/* PREMIUM TIER */}
        <div style={{
          padding: '3.5rem 2.5rem',
          borderRadius: '40px',
          background: 'rgba(99, 102, 241, 0.03)',
          border: '2px solid rgba(99, 102, 241, 0.5)',
          backdropFilter: 'blur(30px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.4s ease',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)'
        }} className="premium-pricing-card">
          <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 12px', background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', color: 'white', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 950, letterSpacing: '1px' }}>POWER USER</div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={28} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, color: 'white' }}>Premium</h2>
                <p style={{ margin: 0, color: '#8b8cf8', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Full Scale Access</p>
              </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                {discountActive ? (
                  <>
                    <span style={{ fontSize: '4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>£10.49</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '1.5rem', textDecoration: 'line-through' }}>£14.99</span>
                  </>
                ) : (
                  <span style={{ fontSize: '4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>£14.99</span>
                )}
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.9rem' }}>/mo</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem', fontWeight: 600 }}>
                For teams and student leaders running large, high-stakes collaboration workflows with advanced controls and dedicated execution capacity.
              </p>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  'Everything in Pro Scholar',
                  'Premium AI quota and faster responses',
                  'Advanced governance and role controls',
                  'Priority queue on heavy collaboration periods',
                  '10GB encrypted cloud storage',
                  'Dedicated onboarding and support lane'
                ].map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>
                    <CheckCircle2 size={16} style={{ color: '#8b8cf8', flexShrink: 0, marginTop: '3px' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            style={{
              width: '100%',
              padding: '1.25rem',
              borderRadius: '24px',
              fontSize: '1rem',
              fontWeight: 950,
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              color: 'white',
              border: 'none',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.35)',
              cursor: 'pointer'
            }}
            onClick={() => handleCheckout('premium')}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === 'premium' ? 'SYNCING...' : 'Upgrade to Premium'}
          </button>
        </div>

        {/* LIFETIME TIER */}
        <div style={{
          padding: '3.5rem 2.5rem',
          borderRadius: '40px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
          border: '2px solid transparent',
          backgroundImage: 'linear-gradient(#0a0a0a, #0a0a0a), linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          backdropFilter: 'blur(30px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.4s ease',
          position: 'relative',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
        }} className="premium-pricing-card">
          <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 16px', background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)', color: 'white', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 950, letterSpacing: '1px' }}>LIFETIME ACCESS</div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={28} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, color: 'white' }}>Founder</h2>
                <p style={{ margin: 0, color: 'var(--brand)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>One-time Clearance</p>
              </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>£49</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.9rem' }}>/once</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem', fontWeight: 700 }}>
                The ultimate clearance level. Reserved for the first 100 early supporters. No monthly fees. All future protocol updates, beta features, and elite branding markers included forever.
              </p>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  'Permanent Protocol Authorization',
                  'Beta Feature Review Lab Access',
                  'Institutional "Founder" Marker',
                  'Unlimited encrypted cloud storage',
                  'All future Pro features included',
                  'Lifetime support mandate'
                ].map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,1)', fontWeight: 800 }}>
                    <CheckCircle2 size={16} style={{ color: '#6366f1', flexShrink: 0, marginTop: '3px' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            style={{
              width: '100%',
              padding: '1.25rem',
              borderRadius: '24px',
              fontSize: '1rem',
              fontWeight: 950,
              background: (lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= 100) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
              color: (lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= 100) ? 'rgba(255,255,255,0.2)' : 'white',
              border: (lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= 100) ? '1px solid rgba(255,255,255,0.1)' : 'none',
              boxShadow: (lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= 100) ? 'none' : '0 10px 30px rgba(99, 102, 241, 0.3)',
              cursor: (lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= 100) ? 'not-allowed' : 'pointer'
            }}
            onClick={() => lifetimeSeatsUsed !== null && lifetimeSeatsUsed < 100 && handleCheckout('lifetime')}
            disabled={loadingPlan !== null || (lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= 100)}
          >
            {loadingPlan === 'lifetime' ? 'AUTHORIZING...' : (lifetimeSeatsUsed !== null && lifetimeSeatsUsed >= 100) ? 'OFFER EXPIRED (Sold Out)' : 'Claim Founding Spot'}
          </button>

          {/* SCARCITY INDICATOR */}
          {lifetimeSeatsUsed !== null && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span style={{ color: lifetimeSeatsUsed >= 90 ? '#ef4444' : 'var(--brand)' }}>
                  {lifetimeSeatsUsed >= 100 ? 'Sold Out' : `Only ${100 - lifetimeSeatsUsed} Spots Left`}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{lifetimeSeatsUsed}/100</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(lifetimeSeatsUsed, 100)}%`,
                  background: lifetimeSeatsUsed >= 90 ? '#ef4444' : 'linear-gradient(90deg, #10b981, #6366f1)',
                  borderRadius: '100px',
                  transition: 'width 1s ease'
                }} />
              </div>
            </div>
          )}
        </div>

      </div>

      {error && (
        <TransientError message={error} type="error" />
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '1rem',
        padding: '1.5rem 2rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '0.85rem',
        fontWeight: 600,
        justifyContent: isLanding ? 'center' : 'flex-start'
      }}>
        <ArrowRight size={18} style={{ color: 'var(--brand)' }} />
        <span>Secure checkout powered by Stripe. Student verification may be required for specific discounts.</span>
      </div>

      <style jsx>{`
        .premium-pricing-card:hover {
          transform: translateY(-8px);
          border-color: rgba(16, 185, 129, 0.2) !important;
          background: rgba(255,255,255,0.02) !important;
        }
        .popular-tier:hover {
          transform: translateY(-12px) scale(1.01);
          box-shadow: 0 40px 80px rgba(0,0,0,0.5) !important;
        }
      `}</style>
    </div>
  )
}
