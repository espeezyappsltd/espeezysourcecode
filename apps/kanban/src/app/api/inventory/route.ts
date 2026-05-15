import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// POST /api/inventory - Save marketplace item to personal inventory
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listing_id } = await req.json()
    if (!listing_id) return NextResponse.json({ error: 'Missing listing ID' }, { status: 400 })

    const adminDb = getAdminDb()

    // 1. Fetch listing details
    const { data: listing, error: fetchError } = await adminDb
      .from('marketplace_listings')
      .select('*')
      .eq('id', listing_id)
      .single()

    if (fetchError) throw fetchError

    // 2. Create personal_asset entry (marketplace_ref type)
    const { data: asset, error: insertError } = await adminDb
      .from('personal_assets')
      .insert({
        user_id: user.id,
        title: listing.title,
        description: listing.description,
        asset_type: 'marketplace_ref',
        asset_url: `/marketplace?id=${listing.id}`,
        preview_url: listing.images?.[0],
        category: listing.category,
        metadata: {
          listing_id: listing.id,
          price: listing.price,
          owner_id: listing.owner_id
        },
        size_bytes: 0 // Refs don't count towards storage quota
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ asset }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
