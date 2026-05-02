import { NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { getAppUrl, getStripeClient, getStripePortalConfigurationId } from '@/utils/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  let stripe
  try {
    stripe = getStripeClient()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Stripe is not configured'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // Get the stripe customer id from the profile
  const { data: profile } = await db
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription found. Please upgrade first.' }, { status: 404 })
  }

  try {
    const configuration = getStripePortalConfigurationId()
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      ...(configuration ? { configuration } : {}),
      return_url: `${getAppUrl()}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Stripe Portal Error:', error)
    const message = error instanceof Error ? error.message : 'Stripe portal creation failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
