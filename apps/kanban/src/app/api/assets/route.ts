import { NextRequest, NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import {
  mergeMetadataCreditValue,
  readCreditValueFromMetadata,
  validateCreditValue,
} from '@/lib/credits'
import { isFolderMarker, normalizeFolderPath } from '@/lib/assets/folders'
import { getStorageQuotaBytes, resolveStoragePlan } from '@/lib/storage-quotas'
import { friendlySupabaseError } from '@/utils/supabase-errors'

export const dynamic = 'force-dynamic'

const BUCKET = 'user-assets'

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\]/g, '_').slice(0, 180)
}

function buildStoragePath(userId: string, folder: string, filename: string): string {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '')
  return `${userId}/${cleanFolder ? `${cleanFolder}/` : ''}${filename}`.replace(/\/+/g, '/')
}

async function readProfileStorage(
  adminDb: ReturnType<typeof getAdminDb>,
  userId: string,
) {
  const { data: profileRow, error: profileError } = await adminDb
    .from('profiles')
    .select('storage_used, subscription_plan')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw new Error(friendlySupabaseError(profileError.message, 'Failed to load storage profile'))
  }

  const tier = resolveStoragePlan(profileRow)
  return {
    storageUsed: profileRow?.storage_used ?? 0,
    storageQuota: getStorageQuotaBytes(tier),
    tier,
  }
}

type PersonalAssetRow = {
  id: string
  user_id: string
  title: string
  description?: string | null
  asset_type: string
  asset_url: string
  preview_url?: string | null
  category?: string | null
  metadata?: unknown
  size_bytes: number
  folder?: string | null
  created_at: string
}

function enrichAsset<T extends { metadata?: unknown; asset_url?: string | null; folder?: string | null }>(
  row: T,
) {
  const metadata = row.metadata as Record<string, unknown> | null
  return {
    ...row,
    credit_value: readCreditValueFromMetadata(metadata),
    is_folder: isFolderMarker(row),
    marketplace_listing_id:
      metadata && typeof metadata.marketplace_listing_id === 'string'
        ? metadata.marketplace_listing_id
        : null,
  }
}

// GET /api/assets - List user assets with pagination and search
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const queryStr = searchParams.get('q')
    const cursor = searchParams.get('cursor')
    const fetchAll = searchParams.get('all') === '1'
    const limit = fetchAll
      ? 500
      : Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

    const adminDb = getAdminDb()
    let query = adminDb
      .from('personal_assets')
      .select(Q.personalAsset)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(fetchAll ? limit : limit + 1)

    if (queryStr) {
      query = query.ilike('title', `%${queryStr}%`)
    }
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: rows, error } = await query

    if (error) {
      throw new Error(friendlySupabaseError(error.message, 'Failed to load assets'))
    }

    const hasMore = (rows?.length ?? 0) > limit
    const assets = (hasMore ? rows?.slice(0, limit) : rows)?.map(enrichAsset) ?? []
    const nextCursor = hasMore ? assets[assets.length - 1]?.created_at : null

    const { data: allMeta } = await adminDb
      .from('personal_assets')
      .select('metadata')
      .eq('user_id', user.id)

    const totalCreditValue =
      allMeta?.reduce(
        (sum, row) => sum + readCreditValueFromMetadata(row.metadata as Record<string, unknown> | null),
        0,
      ) ?? 0

    const { storageUsed, storageQuota, tier: plan } = await readProfileStorage(adminDb, user.id)

    const folderPaths = new Set<string>()
    for (const row of assets) {
      const meta = row.metadata as { folder_path?: string } | null
      if (row.is_folder && meta?.folder_path) {
        folderPaths.add(normalizeFolderPath(meta.folder_path))
      }
      if (row.folder) folderPaths.add(normalizeFolderPath(row.folder))
    }

    return NextResponse.json({
      assets,
      nextCursor,
      totalCreditValue,
      storageUsed,
      storageQuota,
      tier: plan,
      folders: Array.from(folderPaths).sort(),
    })
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
    let asset_url = ''
    let size_bytes = 0
    let category: string | null = null
    let folder = '/'
    let credit_value = 0
    let metadata: Record<string, unknown> | null = null
    let storagePath: string | null = null
    let uploadFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      uploadFile = formData.get('file') as File | null
      title = (formData.get('title') as string) || uploadFile?.name || 'Untitled Asset'
      description = (formData.get('description') as string) || null
      category = (formData.get('category') as string) || null
      folder = (formData.get('folder') as string) || '/'
      const creditCheck = validateCreditValue(formData.get('credit_value') ?? undefined)
      if (!creditCheck.ok) {
        return NextResponse.json({ error: creditCheck.message }, { status: 422 })
      }
      credit_value = creditCheck.value
      if (!uploadFile) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      size_bytes = uploadFile.size
      asset_type = 'file'
    } else {
      const body = await req.json()
      title = body.title
      description = body.description ?? null
      asset_type = body.asset_type === 'link' ? 'link' : 'file'
      asset_url = (body.asset_url as string)?.trim() ?? ''
      size_bytes = 0
      category = body.category ?? null
      folder = body.folder || '/'
      metadata =
        body.metadata && typeof body.metadata === 'object' ? (body.metadata as Record<string, unknown>) : null
      const creditCheck = validateCreditValue(body.credit_value)
      if (!creditCheck.ok) {
        return NextResponse.json({ error: creditCheck.message }, { status: 422 })
      }
      credit_value = creditCheck.value
      if (asset_type === 'link' && !asset_url) {
        return NextResponse.json({ error: 'URL is required for links' }, { status: 400 })
      }
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    folder = normalizeFolderPath(folder)

    const storageBefore = await readProfileStorage(adminDb, user.id)
    if (storageBefore.storageUsed + size_bytes > storageBefore.storageQuota) {
      return NextResponse.json(
        {
          error: 'Quota Exceeded',
          message: `Storage limit reached for ${storageBefore.tier} tier.`,
          storageUsed: storageBefore.storageUsed,
          storageQuota: storageBefore.storageQuota,
        },
        { status: 403 },
      )
    }

    if (uploadFile) {
      const filename = `${Date.now()}-${sanitizeFilename(uploadFile.name)}`
      storagePath = buildStoragePath(user.id, folder, filename)
      const { error: storageError } = await adminDb.storage
        .from(BUCKET)
        .upload(storagePath, uploadFile, { upsert: false, contentType: uploadFile.type })

      if (storageError) {
        return NextResponse.json({ error: storageError.message }, { status: 500 })
      }

      const {
        data: { publicUrl },
      } = adminDb.storage.from(BUCKET).getPublicUrl(storagePath)
      asset_url = publicUrl
    }

    const rowMetadata = mergeMetadataCreditValue(metadata, credit_value)
    if (storagePath) {
      rowMetadata.storage_path = storagePath
    }

    const { data: asset, error: insertError } = await adminDb
      .from('personal_assets')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description,
        asset_type,
        asset_url,
        size_bytes,
        category,
        folder,
        metadata: rowMetadata,
      })
      .select()
      .single()

    if (insertError) {
      if (storagePath) {
        await adminDb.storage.from(BUCKET).remove([storagePath])
      }
      throw insertError
    }

    if (size_bytes > 0) {
      const { error: rpcError } = await adminDb.rpc('increment_storage_used', {
        user_id: user.id,
        amount: size_bytes,
      })
      if (rpcError) {
        await adminDb.from('personal_assets').delete().eq('id', asset.id)
        if (storagePath) await adminDb.storage.from(BUCKET).remove([storagePath])
        throw rpcError
      }
    }

    const storageAfter = await readProfileStorage(adminDb, user.id)

    return NextResponse.json(
      {
        asset: enrichAsset(asset),
        storageUsed: storageAfter.storageUsed,
        storageQuota: storageAfter.storageQuota,
        tier: storageAfter.tier,
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

// PATCH /api/assets - Update asset credit value
export async function PATCH(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const id = body.id as string | undefined
    if (!id) return NextResponse.json({ error: 'Missing asset ID' }, { status: 400 })

    const creditCheck = validateCreditValue(body.credit_value, { required: true })
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.message }, { status: 422 })
    }

    const adminDb = getAdminDb()
    const { data: existing, error: fetchError } = await adminDb
      .from('personal_assets')
      .select('metadata')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw fetchError

    const { data: asset, error: updateError } = await adminDb
      .from('personal_assets')
      .update({
        metadata: mergeMetadataCreditValue(
          existing.metadata as Record<string, unknown> | null,
          creditCheck.value,
        ),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ asset: enrichAsset(asset) })
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

    const { data: asset, error: fetchError } = await adminDb
      .from('personal_assets')
      .select('size_bytes, asset_url, asset_type, folder, title, metadata')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw fetchError

    if (asset.asset_type === 'file') {
      const meta = asset.metadata as { storage_path?: string } | null
      const storagePath =
        meta?.storage_path ??
        buildStoragePath(user.id, asset.folder ?? '/', asset.title)

      const { error: storageDeleteError } = await adminDb.storage.from(BUCKET).remove([storagePath])
      if (storageDeleteError) console.error('Storage delete error:', storageDeleteError)
    }

    const { error: deleteError } = await adminDb
      .from('personal_assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    if (asset.size_bytes > 0) {
      await adminDb.rpc('increment_storage_used', {
        user_id: user.id,
        amount: -asset.size_bytes,
      })
    }

    const storageAfter = await readProfileStorage(adminDb, user.id)

    return NextResponse.json({
      success: true,
      storageUsed: storageAfter.storageUsed,
      storageQuota: storageAfter.storageQuota,
      tier: storageAfter.tier,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
