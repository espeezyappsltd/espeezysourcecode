export type TransactionConfirmCopy = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  type?: 'warning' | 'info' | 'success'
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
