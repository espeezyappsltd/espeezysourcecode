import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { isValidPayPalEmail, normalizePayPalEmail } from '@/lib/paypal/client'
import { isPayPalConfigured } from '@/lib/paypal/config'
import { friendlySupabaseError } from '@/utils/supabase-errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PayoutMethod = 'stripe' | 'paypal'

/**
 * GET /api/paypal/connect — linked PayPal account status.
 * POST { email } — link PayPal by email (manual).
 * PATCH { preferredPayoutMethod } — set default withdrawal rail.
 * DELETE — unlink PayPal.
 */
export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminDb()
  const { data, error } = await db
    .from('profiles')
    .select('paypal_email, paypal_account_status, paypal_linked_at, preferred_payout_method')
    .eq('id', user.id)
    .maybeSingle()

  if (error?.message?.includes('paypal_email')) {
    return NextResponse.json({
      linked: false,
      email: null,
      status: 'unlinked',
      preferredPayoutMethod: 'stripe',
      payoutsConfigured: isPayPalConfigured(),
    })
  }

  if (error) {
    return NextResponse.json(
      { error: friendlySupabaseError(error.message, 'Could not load PayPal status') },
      { status: 500 },
    )
  }

  const linked = data?.paypal_account_status === 'linked' && Boolean(data?.paypal_email)

  return NextResponse.json({
    linked,
    email: linked ? data?.paypal_email : null,
    status: data?.paypal_account_status ?? 'unlinked',
    linkedAt: data?.paypal_linked_at ?? null,
    preferredPayoutMethod: (data?.preferred_payout_method as PayoutMethod) ?? 'stripe',
    payoutsConfigured: isPayPalConfigured(),
  })
}

export async function POST(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { email?: unknown }
  if (typeof body.email !== 'string') {
    return NextResponse.json({ error: 'PayPal email is required.' }, { status: 422 })
  }

  const email = normalizePayPalEmail(body.email)
  if (!isValidPayPalEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid PayPal email address.' }, { status: 422 })
  }

  const db = getAdminDb()
  const { error } = await db
    .from('profiles')
    .update({
      paypal_email: email,
      paypal_account_status: 'linked',
      paypal_linked_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    if (error.message.includes('paypal_email')) {
      return NextResponse.json(
        { error: 'PayPal linking is not available yet — run the latest database migration.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: friendlySupabaseError(error.message, 'Could not link PayPal account') },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, linked: true, email })
}

export async function PATCH(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { preferredPayoutMethod?: unknown }
  const method = body.preferredPayoutMethod
  if (method !== 'stripe' && method !== 'paypal') {
    return NextResponse.json({ error: 'preferredPayoutMethod must be stripe or paypal.' }, { status: 422 })
  }

  const db = getAdminDb()
  const { error } = await db
    .from('profiles')
    .update({ preferred_payout_method: method })
    .eq('id', user.id)

  if (error) {
    if (error.message.includes('preferred_payout_method')) {
      return NextResponse.json(
        { error: 'Payout preferences are not available yet — run the latest database migration.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: friendlySupabaseError(error.message, 'Could not update payout preference') },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, preferredPayoutMethod: method })
}

export async function DELETE(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminDb()
  const { error } = await db
    .from('profiles')
    .update({
      paypal_email: null,
      paypal_account_status: 'unlinked',
      paypal_linked_at: null,
      preferred_payout_method: 'stripe',
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json(
      { error: friendlySupabaseError(error.message, 'Could not unlink PayPal') },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, linked: false })
}
