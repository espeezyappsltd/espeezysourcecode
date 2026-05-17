import { NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'
import { VAULT_QUOTA_BYTES } from '@/lib/admin-rbac'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireAdmin('files')
  if (isAuthError(auth)) return auth

  const form = await req.formData()
  const file = form.get('file')
  const folderId = (form.get('folder_id') as string) || null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const size = file.size
  const { data: used } = await auth.svc.rpc('admin_vault_used_bytes', { p_owner: auth.user.id })
  if (Number(used ?? 0) + size > VAULT_QUOTA_BYTES) {
    return NextResponse.json({ error: '5GB vault quota exceeded' }, { status: 413 })
  }

  const fileId = randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180)
  const storagePath = `${auth.user.id}/${fileId}/${safeName}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await auth.svc.storage.from('admin-vault').upload(storagePath, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: row, error: dbError } = await auth.svc
    .from('admin_vault_files')
    .insert({
      id: fileId,
      owner_id: auth.user.id,
      folder_id: folderId,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: size,
    })
    .select('id, name, folder_id, mime_type, size_bytes, created_at')
    .single()

  if (dbError) {
    await auth.svc.storage.from('admin-vault').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ file: row })
}
