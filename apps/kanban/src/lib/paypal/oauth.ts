import { getPayPalApiBase, getPayPalClientId, getPayPalWebBase } from '@/lib/paypal/config'
import { getAppUrl } from '@/utils/stripe'

export function buildPayPalOAuthUrl(state: string): string {
  const clientId = getPayPalClientId()
  const redirectUri = `${getAppUrl().replace(/\/$/, '')}/api/paypal/connect/callback`
  const base = getPayPalWebBase()

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: redirectUri,
    state,
  })

  return `${base}/signin/authorize?${params.toString()}`
}

export async function exchangePayPalCode(code: string): Promise<{ email: string; payerId?: string }> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString('base64')

  const redirectUri = `${getAppUrl().replace(/\/$/, '')}/api/paypal/connect/callback`

  const tokenRes = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  const tokenData = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string
    error_description?: string
  }

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description ?? 'PayPal authorization failed.')
  }

  const userRes = await fetch(
    `${getPayPalApiBase()}/v1/identity/openidconnect/userinfo/?schema=paypalv1.1`,
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    },
  )

  const userData = (await userRes.json().catch(() => ({}))) as {
    email?: string
    payer_id?: string
    user_id?: string
  }

  if (!userRes.ok || !userData.email) {
    throw new Error('PayPal did not return a verified email for this account.')
  }

  return {
    email: userData.email.toLowerCase(),
    payerId: userData.payer_id ?? userData.user_id,
  }
}
