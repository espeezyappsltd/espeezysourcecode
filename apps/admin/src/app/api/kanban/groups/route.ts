import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const GroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  owner_id: z.string().uuid().optional(),
})

export async function GET() {
  const admin = await createAdminClient()
  const { data, error } = await admin.from('groups').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ groups: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const parse = GroupSchema.safeParse(body)
  if (!parse.success) return NextResponse.json({ error: parse.error }, { status: 422 })
  const admin = await createAdminClient()
  const { data, error } = await admin.from('groups').insert([parse.data]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ group: data })
}
