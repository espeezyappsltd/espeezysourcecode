export type PayPalMode = 'sandbox' | 'live'

export function getPayPalMode(): PayPalMode {
  return process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'
}

export function getPayPalApiBase(): string {
  return getPayPalMode() === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}

export function getPayPalWebBase(): string {
  return getPayPalMode() === 'live' ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com'
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}

export function getPayPalClientId(): string {
  const id = process.env.PAYPAL_CLIENT_ID
  if (!id) throw new Error('PayPal is not configured (missing PAYPAL_CLIENT_ID).')
  return id
}

export function getPayPalClientSecret(): string {
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!secret) throw new Error('PayPal is not configured (missing PAYPAL_CLIENT_SECRET).')
  return secret
}
