import { NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { createCheckoutSession } from '@/services/stripe'
export const dynamic = 'force-dynamic'


export async function POST(req: Request) {
  const db = await createServerSupabaseClient()
  const { data: { user }, error: authErr } = await db.auth.getUser()

  if (authErr || !user) {
    return new NextResponse('Authentication required', { status: 401 })
  }

  const { listingId } = await req.json()
  
  // 1. Fetch listing details
  const { data: listing, error: listErr } = await db
    .from('marketplace_listings')
    .select('*')
    .eq('id', listingId)
    .single()

  if (listErr || !listing) {
    return new NextResponse('Listing not found', { status: 404 })
  }

  if (listing.price <= 0) {
    return new NextResponse('Item is free, use direct handoff', { status: 400 })
  }

  try {
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      price: listing.price,
      type: 'purchase',
      metadata: {
        listing_id: listingId,
        product_name: listing.title,
        seller_id: listing.owner_id
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    return new NextResponse(msg, { status: 500 })
  }
}
