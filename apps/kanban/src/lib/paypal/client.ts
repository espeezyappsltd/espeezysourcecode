import {
  getPayPalApiBase,
  getPayPalClientId,
  getPayPalClientSecret,
  isPayPalConfigured,
} from '@/lib/paypal/config'

type PayPalTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: { value: string; expiresAt: number } | null = null

export async function getPayPalAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new Error('PayPal payouts are not configured on this server.')
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value
  }

  const credentials = Buffer.from(`${getPayPalClientId()}:${getPayPalClientSecret()}`).toString('base64')
  const res = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = (await res.json().catch(() => ({}))) as PayPalTokenResponse & { error_description?: string }
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? 'PayPal authentication failed.')
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 300) * 1000,
  }

  return data.access_token
}

export type PayPalPayoutResult = {
  batchId: string
  itemId: string
  status: string
}

export async function createPayPalPayout(params: {
  receiverEmail: string
  amountCents: number
  currency?: string
  note: string
  senderItemId: string
  batchId: string
}): Promise<PayPalPayoutResult> {
  const token = await getPayPalAccessToken()
  const currency = params.currency ?? 'GBP'
  const amountValue = (params.amountCents / 100).toFixed(2)

  const res = await fetch(`${getPayPalApiBase()}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: params.batchId,
        email_subject: 'You have received an Espeezy payout',
        email_message: 'Your marketplace earnings withdrawal has been sent to your PayPal account.',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: { value: amountValue, currency },
          receiver: params.receiverEmail,
          note: params.note,
          sender_item_id: params.senderItemId,
        },
      ],
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    batch_header?: { payout_batch_id?: string }
    links?: { rel?: string; href?: string }[]
    name?: string
    message?: string
    details?: { issue?: string; description?: string }[]
  }

  if (!res.ok) {
    const detail = data.details?.[0]?.description ?? data.message ?? data.name
    throw new Error(detail ?? 'PayPal payout failed.')
  }

  const batchId = data.batch_header?.payout_batch_id ?? params.batchId
  const itemId = params.senderItemId

  return { batchId, itemId, status: 'PENDING' }
}

export function normalizePayPalEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidPayPalEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}
