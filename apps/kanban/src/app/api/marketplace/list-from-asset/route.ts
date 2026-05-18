import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { readCreditValueFromMetadata, validateCreditValue } from '@/lib/credits'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let assetId: string | undefined
  let meetupZone = 'Library'
  let category = 'Other'
  try {
    const body = await req.json()
    assetId = typeof body?.assetId === 'string' ? body.assetId : undefined
    if (typeof body?.meetupZone === 'string' && body.meetupZone.trim()) {
      meetupZone = body.meetupZone.trim()
    }
    if (typeof body?.category === 'string' && body.category.trim()) {
      category = body.category.trim()
    }
  } catch {
    assetId = undefined
  }

  if (!assetId) {
    return NextResponse.json({ error: 'assetId required' }, { status: 400 })
  }

  const db = getAdminDb()
  const { data: asset, error: assetErr } = await db
    .from('personal_assets')
    .select('*')
    .eq('id', assetId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (assetErr || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  const creditRaw = readCreditValueFromMetadata(asset.metadata as Record<string, unknown>)
  const creditCheck = validateCreditValue(creditRaw, { required: false })
  const price = creditCheck.ok ? creditCheck.value : 0

  const images: string[] = []
  if (asset.preview_url) images.push(asset.preview_url)
  else if (asset.asset_url && /\.(jpg|jpeg|png|gif|webp)/i.test(asset.asset_url)) {
    images.push(asset.asset_url)
  }

  const { data: listing, error: listErr } = await db
    .from('marketplace_listings')
    .insert({
      owner_id: user.id,
      title: asset.title,
      description: asset.description ?? `Listed from personal assets.`,
      price,
      is_free: price === 0,
      category,
      quantity: 1,
      condition: 'Used',
      images,
      meetup_zone: meetupZone,
      meetup_details: 'Coordinate via Espeezy messages after purchase.',
      duration_days: 14,
      payment_method: 'CREDITS',
      status: 'AVAILABLE',
    })
    .select('id, title, price, status, created_at')
    .single()

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 })
  }

  const meta =
    asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata)
      ? { ...(asset.metadata as Record<string, unknown>) }
      : {}

  await db
    .from('personal_assets')
    .update({
      asset_type: 'marketplace_ref',
      metadata: {
        ...meta,
        marketplace_listing_id: listing.id,
        listed_at: new Date().toISOString(),
      },
    })
    .eq('id', assetId)

  return NextResponse.json({ listing }, { status: 201 })
}
