import Stripe from 'stripe'

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-08-27.basil'

export function getStripeClient(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  return new Stripe(stripeKey, {
    apiVersion: STRIPE_API_VERSION,
  })
}

export function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  return webhookSecret
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://espeezy.com').replace(/\/$/, '')
}

export function getStripePortalConfigurationId(): string | undefined {
  return process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined
}