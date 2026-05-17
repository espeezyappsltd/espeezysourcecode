import { NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin('files')
  if (isAuthError(auth)) return auth

  const { id } = await params
  const type = _req.headers.get('x-resource-type') ?? 'file'

  if (type === 'folder') {
    const { data: folder } = await auth.svc
      .from('admin_vault_folders')
      .select('id')
      .eq('id', id)
      .eq('owner_id', auth.user.id)
      .maybeSingle()
    if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { error } = await auth.svc.from('admin_vault_folders').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { data: file } = await auth.svc
    .from('admin_vault_files')
    .select('storage_path')
    .eq('id', id)
    .eq('owner_id', auth.user.id)
    .maybeSingle()

  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await auth.svc.storage.from('admin-vault').remove([file.storage_path])
  const { error } = await auth.svc.from('admin_vault_files').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
