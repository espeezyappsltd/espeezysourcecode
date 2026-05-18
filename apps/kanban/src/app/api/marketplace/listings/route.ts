import { NextRequest, NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import {
  buildListingSearchOr,
  MARKETPLACE_CATEGORIES,
  validateListingRow,
} from '@/lib/marketplace/listing-validation'

export const dynamic = 'force-dynamic'

const LISTING_SELECT =
  'id, owner_id, title, description, price, is_free, images, meetup_zone, meetup_details, duration_days, payment_method, status, category, quantity, condition, created_at'

const PAGE_SIZE_DEFAULT = 24
const PAGE_SIZE_MAX = 48

// GET /api/marketplace/listings — paginated, category + smart search (DB-backed)
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const queryStr = searchParams.get('q')?.trim() ?? ''
    const cursor = searchParams.get('cursor')
    const mine = searchParams.get('mine') === '1'
    const status = (searchParams.get('status') ?? 'AVAILABLE').toUpperCase()
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') ?? String(PAGE_SIZE_DEFAULT), 10), 1),
      PAGE_SIZE_MAX,
    )

    const db = getAdminDb()

    let query = db
      .from('marketplace_listings')
      .select(LISTING_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (mine) {
      query = query.eq('owner_id', user.id)
    } else if (status !== 'ALL') {
      query = query.eq('status', status)
    }

    if (category && category !== 'All' && MARKETPLACE_CATEGORIES.includes(category as (typeof MARKETPLACE_CATEGORIES)[number])) {
      query = query.eq('category', category)
    }

    const searchOr = buildListingSearchOr(queryStr)
    if (searchOr) query = query.or(searchOr)

    if (cursor) query = query.lt('created_at', cursor)

    const { data: rows, error } = await query
    if (error) throw error

    const validated = (rows ?? [])
      .map((row) => validateListingRow(row))
      .filter((row): row is NonNullable<typeof row> => row !== null)

    const ownerIds = Array.from(new Set(validated.map((l) => l.owner_id)))
    const { data: profiles } =
      ownerIds.length > 0
        ? await db.from('profiles').select(Q.profile.card).in('id', ownerIds)
        : { data: [] }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]))

    const enriched = validated.map((listing) => ({
      ...listing,
      profiles: profileMap.get(listing.owner_id) ?? null,
    }))

    const hasMore = enriched.length > limit
    const listings = hasMore ? enriched.slice(0, limit) : enriched
    const nextCursor = hasMore ? listings[listings.length - 1]?.created_at ?? null : null

    return NextResponse.json({
      listings,
      nextCursor,
      categories: MARKETPLACE_CATEGORIES,
      totalReturned: listings.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('Marketplace listings fetch:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
