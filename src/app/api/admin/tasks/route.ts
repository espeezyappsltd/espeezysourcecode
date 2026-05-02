import { NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
export const dynamic = 'force-dynamic'


async function requireAdmin() {
  const db = await createServerSupabaseClient()
  const { data: { user }, error } = await db.auth.getUser()
  if (error || !user) return null
  const svc = await createAdminClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, svc }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await auth.svc
    .from('agent_tasks')
    .select('*, agent:assigned_agent_id(id, name, specialisation)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, priority, assigned_agent_id, depends_on } = body

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const { data, error } = await auth.svc
    .from('agent_tasks')
    .insert({
      title,
      description,
      priority: priority ?? 'medium',
      assigned_agent_id: assigned_agent_id ?? null,
      depends_on: depends_on ?? [],
      created_by: auth.user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data }, { status: 201 })
}
