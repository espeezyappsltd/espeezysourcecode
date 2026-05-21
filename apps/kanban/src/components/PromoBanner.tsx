'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Zap, Gift } from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import {
  REFERRAL_PRO_DISCOUNT_PERCENT,
  REFERRAL_PROMO_HEADLINE,
  REFERRAL_PROMO_TERMS,
} from '@shared/referrals'
import './promo-banner.css'

interface PlatformConfig {
  id: string
  config_key: string
  config_value: Record<string, unknown>
  is_active: boolean
}

type ReferralBannerData = {
  referral_code: string
  redemptions_remaining: number
  max_redemptions: number
}

const DISMISS_KEY = 'gf_promo_dismissed_v3'

export default function PromoBanner() {
  const [isClient] = useState(() => typeof window !== 'undefined')
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [referral, setReferral] = useState<ReferralBannerData | null>(null)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof localStorage === 'undefined') return true
    return !localStorage.getItem(DISMISS_KEY)
  })
  const db = useMemo(() => createBrowserSupabaseClient(), [])

  const loadReferral = useCallback(async () => {
    const { data: { session } } = await db.auth.getSession()
    if (!session?.access_token) {
      setReferral(null)
      return
    }
    const res = await fetch('/api/referral/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = (await res.json().catch(() => ({}))) as ReferralBannerData & { error?: string }
    if (res.ok && json.referral_code) {
      setReferral(json)
    }
  }, [db])

  useEffect(() => {
    if (!isClient) return

    db.from('platform_config')
      .select('*')
      .eq('config_key', 'main_banner')
      .single()
      .then(({ data, error }: { data: PlatformConfig | null; error: unknown }) => {
        if (!error && data) setConfig(data as PlatformConfig)
      })

    const channel = db
      .channel('platform_config_realtime')
      .on(
        // @ts-expect-error Supabase client typings omit postgres_changes filter overload
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_config',
          filter: 'config_key=eq.main_banner',
        },
        (payload: { new: PlatformConfig }) => {
          if (payload.new && typeof payload.new === 'object') {
            setConfig(payload.new as PlatformConfig)
          }
        },
      )
      .subscribe()

    void loadReferral()
    const { data: { subscription } } = db.auth.onAuthStateChange(() => {
      void loadReferral()
    })

    return () => {
      db.removeChannel(channel)
      subscription.unsubscribe()
    }
  }, [isClient, db, loadReferral])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  const configValue =
    typeof config?.config_value === 'object' && config?.config_value !== null
      ? (config.config_value as Record<string, string>)
      : {}

  if (!isClient || !isVisible || !config?.is_active) return null

  const mode = (configValue.mode as string) || 'referral'
  const isReferralMode = mode === 'referral' || mode === 'referral_pro'
  const bannerText =
    (configValue.text as string) ||
    (isReferralMode
      ? REFERRAL_PROMO_HEADLINE
      : '30% OFF ALL CLEARANCE TIERS')
  const promoCode = (configValue.code as string) || 'ELITE30'
  const terms = (configValue.terms as string) || REFERRAL_PROMO_TERMS

  return (
    <div className="promo-banner" role="region" aria-label="Promotional offer">
      <div className="promo-banner__shimmer" aria-hidden />

      <div className="promo-banner__eyebrow">
        {isReferralMode ? <Gift size={15} aria-hidden /> : <Zap size={15} fill="currentColor" aria-hidden />}
        <span>{isReferralMode ? 'Referral program' : 'Current target'}</span>
      </div>

      <div className="promo-banner__message">
        {isReferralMode ? (
          <>
            <span>
              {referral
                ? `Share your code for ${REFERRAL_PRO_DISCOUNT_PERCENT}% off Pro`
                : bannerText}
            </span>
            {referral ? (
              <>
                <span className="promo-banner__code" data-testid="promo-banner-referral-code">
                  {referral.referral_code}
                </span>
                <span className="promo-banner__slots">
                  {referral.redemptions_remaining}/{referral.max_redemptions} discounts left
                </span>
              </>
            ) : (
              <span className="promo-banner__code">{promoCode}</span>
            )}
            <span className="promo-banner__terms">{terms}</span>
          </>
        ) : (
          <>
            <span>{bannerText}</span>
            <span>
              CODE: <span className="promo-banner__code">{promoCode}</span>
            </span>
          </>
        )}
      </div>

      <button type="button" className="promo-banner__dismiss" onClick={handleDismiss} aria-label="Dismiss banner">
        <X size={16} />
      </button>
    </div>
  )
}
