import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAppUrl, getStripeClient } from '@/utils/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Allowed donation amounts in cents (min $1, max $10,000)
const MIN_CENTS = 100
const MAX_CENTS = 1_000_000

const donationSchema = z.object({
  amountCents: z.coerce.number().int().min(MIN_CENTS).max(MAX_CENTS),
  donorEmail: z.email().optional().or(z.literal('')),
  donorName: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().max(500).optional().or(z.literal('')),
  featureTag: z.string().trim().max(80).optional().or(z.literal('')),
  isAnonymous: z.boolean().optional(),
})

export async function POST(req: Request) {
  try {
    const stripe = getStripeClient()
    const body = await req.json().catch(() => null)
    const parsedBody = donationSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Donation amount must be between $1.00 and $10,000.' },
        { status: 422 }
      )
    }

    const { amountCents, donorEmail, donorName, message, featureTag, isAnonymous = false } = parsedBody.data

    const origin = req.headers.get('origin') ?? getAppUrl()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: featureTag
                ? `Espeezy — ${featureTag}`
                : 'Espeezy — Mission Support Donation',
              description:
                'Your contribution funds free, equitable education tools for students worldwide.',
              images: [`${origin}/assets/og-image.png`],
            },
          },
          quantity: 1,
        },
      ],
      customer_email: isAnonymous ? undefined : (donorEmail || undefined),
      success_url: `${origin}/fund/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/fund`,
      billing_address_collection: 'auto',
      submit_type: 'donate',
      metadata: {
        type: 'donation',
        donor_name: isAnonymous ? 'Anonymous' : (donorName || ''),
        donor_email: isAnonymous ? '' : (donorEmail || ''),
        message: message || '',
        feature_tag: featureTag || 'general',
        is_anonymous: String(isAnonymous),
      },
    })

    if (!session.url) {
      throw new Error('No Stripe session URL returned.')
    }

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Stripe error'
    console.error('[donate] Stripe error:', message)
    return NextResponse.json(
      { error: 'Could not initialize donation. Please try again.' },
      { status: 500 }
    )
  }
}
