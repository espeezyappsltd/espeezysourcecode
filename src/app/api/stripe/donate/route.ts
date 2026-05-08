import { NextResponse } from 'next/server'
import { z } from 'zod'
import type Stripe from 'stripe'
import { getAppUrl, getStripeClient, getStripeFundProductId } from '@/utils/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Allowed donation amounts in pence (min £1, max £10,000)
const MIN_CENTS = 100
const MAX_CENTS = 1_000_000

// Canonical Stripe price IDs for fixed GBP donation amounts (from Stripe catalogue)
const GBP_PRICE_MAP: Record<number, string> = {
  500:   'price_1TSHbDGi695k7CdbLRtkEKIZ',  // £5  – prod_UR9v7Y4p1RdHxK
  1000:  'price_1TUetcGi695k7CdbMcBcaxpL',  // £10 – prod_UTc7lUVAgbu1QM
  1500:  'price_1TUf7pGi695k7Cdbv6toq1qn',  // £15 – prod_UTcMNVZmMbY1Sj
  2500:  'price_1TUf8sGi695k7Cdb5kKIUFqf',  // £25 – prod_UTcNJMCMmAD0BI
  5000:  'price_1TUf9uGi695k7CdbUyHGVSDT',  // £50 – prod_UTcO5CNy5uP6N2
  10000: 'price_1TUfAmGi695k7Cdbug9ReSsM',  // £100 – prod_UTcPKHdmE0syPk
}

const donationSchema = z.object({
  amountCents: z.coerce.number().int().min(MIN_CENTS).max(MAX_CENTS),
  donorEmail: z.email().optional().or(z.literal('')),
  donorName: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().max(500).optional().or(z.literal('')),
  featureTag: z.string().trim().max(80).optional().or(z.literal('')),
  isAnonymous: z.boolean().optional(),
})

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Donation service is not available right now. Please try again later.' },
      { status: 503 }
    )
  }
  try {
    const stripe = getStripeClient()
    const body = await req.json().catch(() => null)
    const parsedBody = donationSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Donation amount must be between £1.00 and £10,000.' },
        { status: 422 }
      )
    }

    const { amountCents, donorEmail, donorName, message, featureTag, isAnonymous = false } = parsedBody.data

    const origin = req.headers.get('x-app-origin') ?? req.headers.get('origin') ?? getAppUrl()

    // Use a canonical Stripe price ID for known GBP amounts; fall back to price_data for custom amounts
    const knownPriceId = GBP_PRICE_MAP[amountCents]
    const stripeProductId = getStripeFundProductId(featureTag || 'general')

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = knownPriceId
      ? { price: knownPriceId, quantity: 1 }
      : {
          price_data: stripeProductId
            ? {
                currency: 'gbp',
                unit_amount: amountCents,
                product: stripeProductId,
              }
            : {
                currency: 'gbp',
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
        }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      customer_email: isAnonymous ? undefined : (donorEmail || undefined),
      success_url: `${origin}/donation/success?session_id={CHECKOUT_SESSION_ID}&amount=${(amountCents / 100).toFixed(2)}`,
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
        stripe_product_id: stripeProductId || '',
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
