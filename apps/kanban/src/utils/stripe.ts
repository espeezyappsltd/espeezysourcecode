import Stripe from 'stripe'
import { z } from 'zod'
import { ESPEEZY_APP_ORIGINS, resolveRequestOrigin } from '@shared/app-url'

export const STRIPE_API_VERSION = '2026-04-22.dahlia' as const

const fundProductMapSchema = z.record(z.string(), z.string().trim().min(1))

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

export function getAppUrl(request?: Request | { headers: Headers } | null): string {
  return resolveRequestOrigin(request, ESPEEZY_APP_ORIGINS.kanban)
}

export function getStripePortalConfigurationId(): string | undefined {
  return process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined
}

function getStripeFundProductMap(): Record<string, string> {
  const rawMap = process.env.STRIPE_FUND_PRODUCT_MAP?.trim()
  if (!rawMap) {
    return {}
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawMap)
  } catch {
    throw new Error('STRIPE_FUND_PRODUCT_MAP must be valid JSON.')
  }

  const parsedMap = fundProductMapSchema.safeParse(parsed)
  if (!parsedMap.success) {
    throw new Error('STRIPE_FUND_PRODUCT_MAP must be a JSON object of feature labels to Stripe product IDs.')
  }

  return parsedMap.data
}

export function getStripeFundProductId(featureTag?: string): string | undefined {
  const normalizedFeatureTag = featureTag?.trim()
  const featureProductMap = getStripeFundProductMap()

  if (normalizedFeatureTag && featureProductMap[normalizedFeatureTag]) {
    return featureProductMap[normalizedFeatureTag]
  }

  return process.env.STRIPE_FUND_DEFAULT_PRODUCT_ID?.trim() || undefined
}
