import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db-client'

// Secure CRUD for marketplace listings
export async function GET(req: NextRequest) {
  // List all active listings
  const listings = await db.from('marketplace_listings').select('*').eq('status', 'active')
  return NextResponse.json({ listings })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, description, asset_url, price_cents } = body
  const { data, error } = await db.from('marketplace_listings').insert({
    user_id: session.user.id,
    title,
    description,
    asset_url,
    price_cents,
    status: 'active',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ listing: data })
}
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '../../../proxy'

export const dynamic = 'force-dynamic'

const AssetSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(50),
  asset_url: z.string().url(),
  preview_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  is_featured: z.boolean().optional(),
})

// GET: List all assets with pagination and search
export async function GET(req: Request) {
  await rateLimit(req)
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const queryStr = searchParams.get('q')
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  let q = supabase
    .from('marketplace_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (category) q = q.eq('category', category)
  if (tag) q = q.contains('tags', [tag])
  if (queryStr) q = q.ilike('title', `%${queryStr}%`)
  if (cursor) q = q.lt('created_at', cursor)

  const { data: rows, error } = await q
  
  if (error) return NextResponse.json({
    error: 'Could not load assets.',
    message: 'Something went wrong. Please refresh or contact support if this continues.'
  }, { status: 500 })

  const hasMore = (rows?.length ?? 0) > limit
  const assets = hasMore ? rows?.slice(0, limit) : rows
  const nextCursor = hasMore ? assets?.[assets.length - 1].created_at : null

  return NextResponse.json({ assets, nextCursor }, { status: 200 })
}

// POST: Create new asset
export async function POST(req: Request) {
  await rateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({
    error: 'Unauthorized',
    message: 'Please log in to continue.'
  }, { status: 401 })
  const body = await req.json()
  const parse = AssetSchema.safeParse(body)
  if (!parse.success) return NextResponse.json({
    error: 'Invalid input',
    message: 'Please check your asset details and try again.'
  }, { status: 422 })
  const asset = { ...parse.data, user_id: user.id }
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('marketplace_assets').insert([asset]).select('*').single()
  if (error) return NextResponse.json({
    error: 'Could not create asset.',
    message: 'Something went wrong. Please refresh or contact support.'
  }, { status: 500 })
  return NextResponse.json({ asset: data }, { status: 201 })
}
