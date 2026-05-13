import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const TaskSchema = z.object({
  group_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['To Do', 'In Progress', 'In Review', 'Done']).optional(),
  assignees: z.array(z.string().uuid()).optional(),
  due_date: z.string().optional(),
  artifacts: z.any().optional(),
  category: z.string().optional(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const group_id = searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'Missing group_id' }, { status: 422 })
  const admin = await createAdminClient()
  const { data, error } = await admin.from('tasks').select('*').eq('group_id', group_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const parse = TaskSchema.safeParse(body)
  if (!parse.success) return NextResponse.json({ error: parse.error }, { status: 422 })
  const admin = await createAdminClient()
  const { data, error } = await admin.from('tasks').insert([parse.data]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}
