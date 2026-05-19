import { getAdminDb } from '@/lib/supabase/admin'
import {
  CREDITS_PER_PRO_MONTH,
  MAX_ASSET_CREDIT_VALUE,
  clampCreditValue,
  readCreditValueFromMetadata,
} from '@/lib/credits'
import { breakdownPlatformFee } from '@/lib/platform/fees'
import { getTradingMetricsForUser } from '@/lib/marketplace/trading-metrics'
import { getUserCredits, completeMarketplaceCreditPurchase } from '@/lib/marketplace/checkout-service'
import { createCreditFundCheckout, creditsToFundGbp } from '@/lib/credits/fund-stripe'

export type ListingCheckoutContext = {
  listingId: string
  title: string
  priceCredits: number
  platformFeeCredits: number
  sellerNetCredits: number
  assetCreditValue: number
  creditTierLabel: string
  sellerId: string
  available: boolean
}

import type { BuyerCheckoutPreflight } from '@/types/marketplace-checkout'

export type { BuyerCheckoutPreflight }

export type MarketplaceCheckoutResult = {
  purchaseId: string
  invoiceNumber: string
  creditsAmount: number
  platformFeeCredits: number
  sellerNetCredits: number
  assetCreditValue: number
  buyerCredits: number
  sellerCredits: number
  sellerId: string
  listingTitle: string
  paymentLinkUrl: string
  sellerWithdrawableCredits: number
}

export function creditPackForShortfall(shortfall: number): number {
  if (shortfall <= 0) return CREDITS_PER_PRO_MONTH
  return shortfall > CREDITS_PER_PRO_MONTH ? MAX_ASSET_CREDIT_VALUE : CREDITS_PER_PRO_MONTH
}

export function creditTierLabel(credits: number): string {
  return `${credits} credit${credits === 1 ? '' : 's'}`
}

async function resolveAssetCreditValue(listingId: string, ownerId: string, listingPrice: number): Promise<number> {
  const db = getAdminDb()
  const { data: assets } = await db
    .from('personal_assets')
    .select('metadata')
    .eq('user_id', ownerId)

  for (const row of assets ?? []) {
    const meta = row.metadata as Record<string, unknown> | null
    if (!meta) continue
    if (meta.marketplace_listing_id === listingId) {
      const v = readCreditValueFromMetadata(meta)
      if (v > 0) return v
    }
    const history = meta.listing_ids
    if (Array.isArray(history) && history.includes(listingId)) {
      const v = readCreditValueFromMetadata(meta)
      if (v > 0) return v
    }
  }

  return clampCreditValue(listingPrice)
}

export async function getListingCheckoutContext(listingId: string): Promise<ListingCheckoutContext | null> {
  const db = getAdminDb()
  const { data: listing, error } = await db
    .from('marketplace_listings')
    .select('id, title, price, owner_id, status')
    .eq('id', listingId)
    .maybeSingle()

  if (error || !listing) return null

  const priceCredits = clampCreditValue(listing.price ?? 0)
  const feeBreakdown = breakdownPlatformFee(priceCredits)
  const assetCreditValue = await resolveAssetCreditValue(listing.id, listing.owner_id, priceCredits)

  return {
    listingId: listing.id,
    title: listing.title,
    priceCredits,
    platformFeeCredits: feeBreakdown.platformFeeCredits,
    sellerNetCredits: feeBreakdown.netCredits,
    assetCreditValue,
    creditTierLabel: creditTierLabel(assetCreditValue),
    sellerId: listing.owner_id,
    available: !['SOLD', 'sold', 'UNAVAILABLE'].includes(String(listing.status ?? '').toUpperCase()),
  }
}

export async function getBuyerCheckoutPreflight(
  buyerId: string,
  listingId: string,
): Promise<BuyerCheckoutPreflight> {
  const ctx = await getListingCheckoutContext(listingId)
  if (!ctx) {
    throw new Error('Listing not found')
  }

  if (ctx.sellerId === buyerId) {
    throw new Error('You cannot purchase your own listing.')
  }

  if (!ctx.available) {
    throw new Error('This item has already been sold.')
  }

  const buyerCredits = await getUserCredits(buyerId)
  const shortfall = Math.max(0, ctx.priceCredits - buyerCredits)
  const canAfford = shortfall === 0
  let topUpPackCredits: number | null = null
  let topUpPaymentUrl: string | null = null

  if (!canAfford && ctx.priceCredits > 0) {
    topUpPackCredits = creditPackForShortfall(shortfall)
    try {
      const { data: profile } = await getAdminDb()
        .from('profiles')
        .select('email')
        .eq('id', buyerId)
        .maybeSingle()

      const fundGbp = creditsToFundGbp(topUpPackCredits)
      const fund = await createCreditFundCheckout({
        userId: buyerId,
        email: profile?.email ?? undefined,
        amountGbp: fundGbp,
        returnPath: `/marketplace?item=${listingId}`,
        listingId,
        contextLabel: `Top up to buy "${ctx.title}"`,
      })
      topUpPackCredits = fund.creditsAmount
      topUpPaymentUrl = fund.checkoutUrl

      await getAdminDb().from('credit_fund_checkouts').upsert(
        {
          user_id: buyerId,
          stripe_session_id: fund.sessionId,
          amount_gbp: fund.amountGbp,
          credits_amount: fund.creditsAmount,
          status: 'pending',
          return_path: `/marketplace?item=${listingId}`,
          listing_id: listingId,
        },
        { onConflict: 'stripe_session_id' },
      )
    } catch (err) {
      console.warn('[purchase-flow] credit top-up session failed:', err)
      topUpPaymentUrl = `${appUrlFallback()}/account/credits`
    }
  }

  return {
    ...ctx,
    buyerCredits,
    canAfford,
    shortfall,
    topUpPackCredits,
    topUpPaymentUrl,
  }
}

function appUrlFallback(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://kanban.espeezy.com').replace(/\/$/, '')
}

export async function executeMarketplaceCreditCheckout(
  buyerId: string,
  listingId: string,
): Promise<MarketplaceCheckoutResult> {
  const preflight = await getBuyerCheckoutPreflight(buyerId, listingId)

  if (!preflight.canAfford && preflight.priceCredits > 0) {
    const err = new Error(
      `Insufficient Espeezy credits. You need ${preflight.shortfall} more (${preflight.creditTierLabel} listing).`,
    ) as Error & {
      code: 'INSUFFICIENT_CREDITS'
      preflight: BuyerCheckoutPreflight
    }
    err.code = 'INSUFFICIENT_CREDITS'
    err.preflight = preflight
    throw err
  }

  const result = await completeMarketplaceCreditPurchase(buyerId, listingId)
  const appUrl = appUrlFallback()
  const paymentLinkUrl = `${appUrl}/marketplace/invoice/${result.purchaseId}`

  let sellerWithdrawableCredits = 0
  try {
    const sellerMetrics = await getTradingMetricsForUser(result.sellerId)
    sellerWithdrawableCredits = sellerMetrics.availableWithdrawCredits
  } catch {
    sellerWithdrawableCredits = 0
  }

  return {
    ...result,
    assetCreditValue: preflight.assetCreditValue,
    paymentLinkUrl,
    sellerWithdrawableCredits,
  }
}
