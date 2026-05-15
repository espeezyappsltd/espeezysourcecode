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
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

// POST /api/assets - Create/Upload asset
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentType = req.headers.get('content-type') || ''
    const adminDb = getAdminDb()
    
    let title: string
    let description: string | null = null
    let asset_type: 'file' | 'link' | 'marketplace_ref' = 'file'
    let asset_url: string
    let size_bytes: number = 0
    let category: string | null = null
    let folder: string = '/'

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      title = formData.get('title') as string || file?.name || 'Untitled Asset'
      description = formData.get('description') as string
      category = formData.get('category') as string
      folder = formData.get('folder') as string || '/'
      
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      
      size_bytes = file.size
      asset_type = 'file'

      // Upload to Storage
      const path = `${user.id}/${folder.replace(/^\/+|\/+$/g, '')}/${file.name}`.replace(/\/+/g, '/')
      const { data: storageData, error: storageError } = await adminDb.storage
        .from('user-assets')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (storageError) throw storageError

      // Get public URL
      const { data: { publicUrl } } = adminDb.storage
        .from('user-assets')
        .getPublicUrl(path)
      
      asset_url = publicUrl
    } else {
      const body = await req.json()
      title = body.title
      description = body.description
      asset_type = body.asset_type || 'link'
      asset_url = body.asset_url
      size_bytes = body.size_bytes || 0
      category = body.category
      folder = body.folder || '/'
    }

    if (!title || !asset_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    // 2. Insert Asset Metadata
    const { data: asset, error: insertError } = await adminDb
      .from('personal_assets')
      .insert({
        user_id: user.id,
        title,
        description,
        asset_type,
        asset_url,
        size_bytes,
        category,
        folder
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 3. Update profile storage_used
    await adminDb.rpc('increment_storage_used', { 
      user_id: user.id, 
      amount: size_bytes 
    })

    // 4. Seed README if it's the first asset
    const { count } = await adminDb
      .from('personal_assets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count === 1) {
      // Seed README.txt
      const readmeContent = `Welcome to your Espeezy Storage!\n\nThis is your private node for academic assets.\nHappy building!`
      const readmePath = `${user.id}/README.txt`
      await adminDb.storage.from('user-assets').upload(readmePath, readmeContent, { contentType: 'text/plain' })
      
      // Also insert into table
      await adminDb.from('personal_assets').insert({
        user_id: user.id,
        title: 'README.txt',
        description: 'Storage instructions',
        asset_type: 'file',
        asset_url: adminDb.storage.from('user-assets').getPublicUrl(readmePath).data.publicUrl,
        size_bytes: readmeContent.length,
        folder: '/'
      })
    }

    return NextResponse.json({ asset }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
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

    // 1. Get asset to know its size and URL/path
    const { data: asset, error: fetchError } = await adminDb
      .from('personal_assets')
      .select('size_bytes, asset_url, asset_type, folder, title')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw fetchError

    // 2. Delete from Storage if it's a file
    if (asset.asset_type === 'file') {
      // Extract path from URL or reconstruct it
      // Standard path: user_id/folder/title
      const cleanFolder = asset.folder.replace(/^\/+|\/+$/g, '')
      const storagePath = `${user.id}/${cleanFolder ? cleanFolder + '/' : ''}${asset.title}`.replace(/\/+/g, '/')
      
      const { error: storageDeleteError } = await adminDb.storage
        .from('user-assets')
        .remove([storagePath])
      
      // We don't strictly throw here if file is missing (maybe already gone)
      if (storageDeleteError) console.error('Storage delete error:', storageDeleteError)
    }

    // 3. Delete from DB
    const { error: deleteError } = await adminDb
      .from('personal_assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    // 4. Update profile storage_used (negative amount)
    await adminDb.rpc('increment_storage_used', { 
      user_id: user.id, 
      amount: -asset.size_bytes 
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
