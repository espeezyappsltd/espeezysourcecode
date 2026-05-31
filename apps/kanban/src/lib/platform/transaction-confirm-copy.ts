import { formatCredits, formatGbpApprox } from '@/lib/credits'
import { breakdownPlatformFee, formatPlatformFeeHint } from '@/lib/platform/fees'
import type { TradeAction } from '@/services/hustle'

export type TransactionConfirmCopy = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  type?: 'warning' | 'info' | 'success'
}

export function marketplacePurchaseCopy(
  listingTitle: string,
  priceCredits: number,
): TransactionConfirmCopy {
  if (priceCredits <= 0) {
    return {
      title: 'Claim this item?',
      message: `"${listingTitle}" is free. Add it to your inventory now?`,
      confirmLabel: 'Claim',
      type: 'info',
    }
  }
  const fee = breakdownPlatformFee(priceCredits)
  const feeNote =
    fee.platformFeeCredits > 0
      ? ` A ${formatGbpApprox(fee.platformFeeCredits)} platform fee is included.`
      : ''
  return {
    title: 'Confirm purchase',
    message: `Pay ${formatCredits(priceCredits)} for "${listingTitle}"?${feeNote} This charge is final.`,
    confirmLabel: `Pay ${formatCredits(priceCredits)}`,
    type: 'warning',
  }
}

export function marketplaceWithdrawCopy(
  creditsAmount: number,
  payoutMethod: 'stripe' | 'paypal',
): TransactionConfirmCopy {
  const via = payoutMethod === 'paypal' ? 'PayPal' : 'your linked bank (Stripe)'
  return {
    title: 'Confirm withdrawal',
    message: `Withdraw ${formatGbpApprox(creditsAmount)} to ${via}? Processing may take 1–2 business days.`,
    confirmLabel: 'Withdraw',
    type: 'warning',
  }
}

export function hustlePostCopy(
  title: string,
  payoutCredits: number,
  fundNow: boolean,
): TransactionConfirmCopy {
  const feeHint = formatPlatformFeeHint(payoutCredits)
  if (fundNow) {
    return {
      title: 'Post and fund escrow?',
      message: `Post "${title}" with ${formatGbpApprox(payoutCredits)} in escrow now. ${feeHint} Contributors can apply once funded.`,
      confirmLabel: 'Post & fund',
      type: 'warning',
    }
  }
  return {
    title: 'Post this gig?',
    message: `Publish "${title}" with a ${formatGbpApprox(payoutCredits)} payout? You can fund escrow when you accept a contributor.`,
    confirmLabel: 'Post gig',
    type: 'info',
  }
}

const HUSTLE_ACTION_COPY: Record<
  TradeAction,
  (ctx: { taskTitle: string; credits: number; applicantName?: string }) => TransactionConfirmCopy
> = {
  fund: ({ taskTitle, credits }) => ({
    title: 'Fund escrow?',
    message: `Lock ${formatGbpApprox(credits)} in escrow for "${taskTitle}"? Funds leave your balance until the project completes or is cancelled.`,
    confirmLabel: 'Fund escrow',
    type: 'warning',
  }),
  apply: ({ taskTitle }) => ({
    title: 'Apply for this gig?',
    message: `Send your application for "${taskTitle}"? The poster will review applicants before assigning.`,
    confirmLabel: 'Apply',
    type: 'info',
  }),
  accept: ({ taskTitle, applicantName }) => ({
    title: 'Accept this worker?',
    message: `Assign ${applicantName ?? 'this scholar'} to "${taskTitle}"? Escrow will be funded automatically if your balance is sufficient.`,
    confirmLabel: 'Accept',
    type: 'warning',
  }),
  start: ({ taskTitle }) => ({
    title: 'Start project?',
    message: `Mark "${taskTitle}" as in progress? The poster will be notified.`,
    confirmLabel: 'Start',
    type: 'info',
  }),
  submit: ({ taskTitle }) => ({
    title: 'Submit for review?',
    message: `Submit your delivery on "${taskTitle}" for poster approval?`,
    confirmLabel: 'Submit',
    type: 'info',
  }),
  approve: ({ taskTitle, credits }) => {
    const fee = breakdownPlatformFee(credits)
    const netLine =
      fee.platformFeeCredits > 0
        ? ` Worker receives ${formatGbpApprox(fee.netCredits)} after ${formatGbpApprox(fee.platformFeeCredits)} platform fee.`
        : ''
    return {
      title: 'Approve and pay?',
      message: `Release ${formatGbpApprox(credits)} from escrow for "${taskTitle}"?${netLine} This cannot be undone.`,
      confirmLabel: 'Approve & pay',
      type: 'warning',
    }
  },
  cancel: ({ taskTitle, credits }) => ({
    title: 'Cancel this task?',
    message:
      credits > 0
        ? `Cancel "${taskTitle}" and refund ${formatGbpApprox(credits)} escrow to your balance?`
        : `Cancel "${taskTitle}"? This cannot be undone.`,
    confirmLabel: 'Cancel task',
    destructive: true,
    type: 'warning',
  }),
}

export function hustleTradeCopy(
  action: TradeAction,
  ctx: { taskTitle: string; credits: number; applicantName?: string },
): TransactionConfirmCopy {
  return HUSTLE_ACTION_COPY[action](ctx)
}

const SUBSCRIPTION_PLAN_META: Record<string, { label: string; price: string }> = {
  pro: { label: 'Pro Scholar', price: '£4.99/month' },
  premium: { label: 'Premium Scholar', price: '£14.99/month' },
  lifetime: { label: 'Lifetime Scholar', price: '£149 one-time' },
}

export function subscriptionCheckoutCopy(plan: string): TransactionConfirmCopy {
  const meta = SUBSCRIPTION_PLAN_META[plan] ?? { label: plan, price: 'see Stripe checkout' }
  return {
    title: 'Continue to checkout?',
    message: `You will be redirected to Stripe for ${meta.label} (${meta.price}). Billing is managed by the Espeezy platform team.`,
    confirmLabel: 'Continue to Stripe',
    type: 'info',
  }
}

export function marketplaceListingPublishCopy(
  title: string,
  priceCredits: number,
): TransactionConfirmCopy {
  return {
    title: 'Publish listing?',
    message:
      priceCredits > 0
        ? `List "${title}" for ${formatGbpApprox(priceCredits)}? Buyers pay in GBP when they purchase.`
        : `List "${title}" for free on the campus marketplace?`,
    confirmLabel: 'Publish',
    type: 'info',
  }
}

export function marketplaceListFromAssetCopy(title: string, creditValue: number): TransactionConfirmCopy {
  return marketplaceListingPublishCopy(title, creditValue)
}

export function feedPostCopy(visibility: 'public' | 'connections'): TransactionConfirmCopy {
  return {
    title: 'Post to feed?',
    message:
      visibility === 'public'
        ? 'Share this update on the public Academic Journeys feed?'
        : 'Share this update with your connections only?',
    confirmLabel: 'Post',
    type: 'info',
  }
}
