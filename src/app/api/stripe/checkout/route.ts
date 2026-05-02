import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { getStripeClient } from '@/utils/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'premium', 'lifetime']).default('pro'),
})

const PLAN_CONFIG: Record<z.infer<typeof checkoutSchema>['plan'], { priceEnvKey: string; mode: 'subscription' | 'payment'; label: string }> = {
  pro:      { priceEnvKey: 'STRIPE_PRICE_PRO_ID',      mode: 'subscription', label: 'Pro Scholar — £3.99/month' },
  premium:  { priceEnvKey: 'STRIPE_PRICE_PREMIUM_ID',  mode: 'subscription', label: 'Premium Scholar — £10.49/month' },
  lifetime: { priceEnvKey: 'STRIPE_PRICE_LIFETIME_ID', mode: 'payment',      label: 'Lifetime Founding Scholar — £49' },
}

export async function POST(req: Request) {
  let stripe
  try {
    stripe = getStripeClient()
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Stripe is not configured' }, { status: 500 })
  }

  try {
    // Get session token from headers
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid
    const email = decodedToken.email

    const body = await req.json().catch(() => null)
    const parsedBody = checkoutSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 422 })
    }

    const planKey = parsedBody.data.plan
    const config = PLAN_CONFIG[planKey]

    const priceId = process.env[config.priceEnvKey]
    const successUrl = process.env.STRIPE_SUCCESS_URL
    const cancelUrl = process.env.STRIPE_CANCEL_URL

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Stripe is not configured correctly.' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      metadata: {
        user_id: uid,
        plan: planKey,
        product_label: config.label,
      },
    })

    if (!session.url) {
      throw new Error('Unable to initialize Stripe checkout session.')
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error.message)
    return NextResponse.json({ error: error.message || 'Stripe session creation failed.' }, { status: 500 })
  }
}
