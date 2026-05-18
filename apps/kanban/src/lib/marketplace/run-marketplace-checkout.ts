'use client'

import type { BuyerCheckoutPreflight } from '@/types/marketplace-checkout'
import { formatCredits } from '@/lib/credits'

export type CheckoutToast = (title: string, message: string, type?: string) => void

export type MarketplaceCheckoutSuccess = {
  buyerCredits: number
  purchaseId: string
  paymentLinkUrl?: string
  assetCreditValue?: number
  sellerWithdrawableCredits?: number
}

export async function runMarketplaceCreditCheckout(
  listingId: string,
  addToast: CheckoutToast,
): Promise<MarketplaceCheckoutSuccess | null> {
  const preRes = await fetch('/api/marketplace/purchase/preflight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ listingId }),
  })

  const pre = (await preRes.json().catch(() => ({}))) as BuyerCheckoutPreflight & {
    error?: string
    message?: string
    paymentLinkLabel?: string
  }

  if (!preRes.ok) {
    addToast('Checkout unavailable', pre.message ?? pre.error ?? 'Try again.', 'error')
    return null
  }

  if (!pre.canAfford && pre.priceCredits > 0) {
    if (pre.topUpPaymentUrl) {
      window.open(pre.topUpPaymentUrl, '_blank', 'noopener')
    }
    addToast(
      'Top up required',
      `This listing is ${pre.paymentLinkLabel ?? formatCredits(pre.assetCreditValue)}. You need ${formatCredits(pre.shortfall)} more credits — opened the ${pre.topUpPackCredits ?? 50}-credit payment link.`,
      'warning',
    )
    return null
  }

  const res = await fetch('/api/marketplace/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ listingId }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    message?: string
    code?: string
    buyerCredits?: number
    purchaseId?: string
    paymentLinkUrl?: string
    invoiceUrl?: string
    assetCreditValue?: number
    sellerWithdrawableCredits?: number
    topUpPaymentUrl?: string
    preflight?: BuyerCheckoutPreflight
  }

  if (!res.ok) {
    if (res.status === 402 && data.topUpPaymentUrl) {
      window.open(data.topUpPaymentUrl, '_blank', 'noopener')
      addToast('Top up required', data.message ?? data.error ?? 'Add credits to continue.', 'warning')
      return null
    }
    addToast('Checkout failed', data.message ?? data.error ?? 'Try again.', 'error')
    return null
  }

  const paymentLink = data.paymentLinkUrl ?? data.invoiceUrl
  if (paymentLink) {
    window.open(paymentLink, '_blank', 'noopener')
  }

  if (typeof data.buyerCredits === 'number' && data.purchaseId) {
    return {
      buyerCredits: data.buyerCredits,
      purchaseId: data.purchaseId,
      paymentLinkUrl: paymentLink,
      assetCreditValue: data.assetCreditValue,
      sellerWithdrawableCredits: data.sellerWithdrawableCredits,
    }
  }

  return null
}
