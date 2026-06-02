import { NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
import { z } from 'zod'
import { createClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

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

// GET: List all assets (optionally by category/tag)
export async function GET(req: Request) {
  await rateLimit(req)
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  let q = supabase.from('marketplace_assets').select(Q.marketplace.asset).order('created_at', { ascending: false })
  if (category) q = q.eq('category', category)
  if (tag) q = q.contains('tags', [tag])
  const { data, error } = await q.limit(50)
  if (error) return NextResponse.json({
    error: 'Could not load assets.',
    message: 'Something went wrong. Please refresh or contact support if this continues.'
  }, { status: 500 })
  return NextResponse.json({ assets: data }, { status: 200 })
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
  const { data, error } = await admin.from('marketplace_assets').insert([asset]).select(Q.marketplace.asset).single()
  if (error) return NextResponse.json({
    error: 'Could not create asset.',
    message: 'Something went wrong. Please refresh or contact support.'
  }, { status: 500 })
  return NextResponse.json({ asset: data }, { status: 201 })
}
