import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const QUOTAS = {
  free: 1024 * 1024 * 1024, // 1GB
  pro: 5 * 1024 * 1024 * 1024, // 5GB
  premium: 20 * 1024 * 1024 * 1024, // 20GB
  admin: 100 * 1024 * 1024 * 1024, // 100GB
}

// GET /api/assets - List user assets with pagination and search
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const queryStr = searchParams.get('q')
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

    const adminDb = getAdminDb()
    let query = adminDb
      .from('personal_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (queryStr) {
      query = query.ilike('title', `%${queryStr}%`)
    }
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: rows, error } = await query

    if (error) throw error

    const hasMore = (rows?.length ?? 0) > limit
    const assets = hasMore ? rows?.slice(0, limit) : rows
    const nextCursor = hasMore ? assets?.[assets.length - 1].created_at : null

    return NextResponse.json({ assets, nextCursor })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/assets - Create/Upload asset
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, description, asset_type, asset_url, size_bytes = 0, category } = body

    if (!title || !asset_type || !asset_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    
    // 1. Check Quota
    const { data: profile, error: profileError } = await adminDb
      .from('profiles')
      .select('tier, storage_used')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    const tier = (profile.tier as keyof typeof QUOTAS) || 'free'
    const quota = QUOTAS[tier]
    
    if (profile.storage_used + size_bytes > quota) {
      return NextResponse.json({ 
        error: 'Quota Exceeded', 
        message: `Your current tier (${tier}) is limited to ${quota / (1024*1024*1024)}GB.` 
      }, { status: 403 })
    }

    // 2. Insert Asset
    const { data: asset, error: insertError } = await adminDb
      .from('personal_assets')
      .insert({
        user_id: user.id,
        title,
        description,
        asset_type,
        asset_url,
        size_bytes,
        category
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 3. Update profile storage_used
    await adminDb.rpc('increment_storage_used', { 
      user_id: user.id, 
      amount: size_bytes 
    })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/assets - Delete asset
export async function DELETE(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing asset ID' }, { status: 400 })

    const adminDb = getAdminDb()

    // 1. Get asset to know its size
    const { data: asset, error: fetchError } = await adminDb
      .from('personal_assets')
      .select('size_bytes')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw fetchError

    // 2. Delete asset
    const { error: deleteError } = await adminDb
      .from('personal_assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    // 3. Update profile storage_used (negative amount)
    await adminDb.rpc('increment_storage_used', { 
      user_id: user.id, 
      amount: -asset.size_bytes 
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
