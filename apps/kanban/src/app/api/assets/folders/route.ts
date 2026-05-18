import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { FOLDER_SCHEME, joinFolderPath, normalizeFolderPath } from '@/lib/assets/folders'
import { mergeMetadataCreditValue } from '@/lib/credits'

export const dynamic = 'force-dynamic'

// POST /api/assets/folders — create virtual folder
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const parentFolder = normalizeFolderPath(body.parentFolder)

    if (!name || name.length > 64) {
      return NextResponse.json({ error: 'Folder name must be 1–64 characters.' }, { status: 400 })
    }
    if (/[/\\]/.test(name)) {
      return NextResponse.json({ error: 'Folder name cannot contain slashes.' }, { status: 400 })
    }

    const folderPath = joinFolderPath(parentFolder, name)
    const adminDb = getAdminDb()

    const { data: markers } = await adminDb
      .from('personal_assets')
      .select('id, metadata')
      .eq('user_id', user.id)
      .eq('asset_url', FOLDER_SCHEME)

    const existing = markers?.find((m) => {
      const meta = m.metadata as { folder_path?: string } | null
      return normalizeFolderPath(meta?.folder_path) === folderPath
    })

    if (existing) {
      return NextResponse.json({ error: 'Folder already exists.', folder: folderPath }, { status: 409 })
    }

    const { data: row, error } = await adminDb
      .from('personal_assets')
      .insert({
        user_id: user.id,
        title: name,
        description: 'Virtual folder',
        asset_type: 'link',
        asset_url: FOLDER_SCHEME,
        size_bytes: 0,
        folder: parentFolder,
        metadata: mergeMetadataCreditValue({ is_folder: true, folder_path: folderPath }, 0),
      })
      .select('id, title, folder, metadata, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ folder: folderPath, marker: row }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
