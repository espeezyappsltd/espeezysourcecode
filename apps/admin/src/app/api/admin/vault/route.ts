import { NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'
import { VAULT_QUOTA_BYTES } from '@/lib/admin-rbac'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin('files')
  if (isAuthError(auth)) return auth

  const { svc, user } = auth
  const parentId = null

  const [{ data: folders }, { data: files }, usedRes] = await Promise.all([
    svc.from('admin_vault_folders').select('id, name, parent_id, created_at').eq('owner_id', user.id).is('parent_id', null).order('name'),
    svc.from('admin_vault_files').select('id, name, folder_id, mime_type, size_bytes, created_at').eq('owner_id', user.id).is('folder_id', null).order('name'),
    svc.rpc('admin_vault_used_bytes', { p_owner: user.id }),
  ])

  const used = Number(usedRes.data ?? 0)

  const { data: shared } = await svc
    .from('admin_vault_shares')
    .select('id, resource_type, resource_id, permission, shared_by, shared_with')
    .eq('shared_with', user.id)

  const { data: staff } = await svc
    .from('admin_members')
    .select('id, username, display_name')
    .eq('is_active', true)
    .neq('id', user.id)

  return NextResponse.json({
    folders: folders ?? [],
    files: files ?? [],
    shared: shared ?? [],
    staff: staff ?? [],
    quota: { used, cap: VAULT_QUOTA_BYTES },
  })
}

export async function POST(req: Request) {
  const auth = await requireAdmin('files')
  if (isAuthError(auth)) return auth

  const body = await req.json().catch(() => ({}))
  const action = body.action as string

  if (action === 'create_folder') {
    const name = String(body.name ?? '').trim()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const { data, error } = await auth.svc
      .from('admin_vault_folders')
      .insert({
        owner_id: auth.user.id,
        parent_id: body.parent_id ?? null,
        name,
      })
      .select('id, name, parent_id, created_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ folder: data })
  }

  if (action === 'share') {
    const resourceType = body.resource_type === 'folder' ? 'folder' : 'file'
    const resourceId = body.resource_id as string
    const sharedWith = body.shared_with as string
    if (!resourceId || !sharedWith) {
      return NextResponse.json({ error: 'Invalid share payload' }, { status: 400 })
    }
    const { data, error } = await auth.svc
      .from('admin_vault_shares')
      .insert({
        resource_type: resourceType,
        resource_id: resourceId,
        shared_by: auth.user.id,
        shared_with: sharedWith,
        permission: body.permission === 'write' ? 'write' : 'read',
      })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ share: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
