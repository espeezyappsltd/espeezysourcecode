import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  avatar_url: z.string().optional(),
  group_id: z.string().uuid().optional(),
  total_score: z.number().optional(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const group_id = searchParams.get('group_id')
  const admin = await createAdminClient()
  let query = admin.from('profiles').select('*')
  if (group_id) query = query.eq('group_id', group_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profiles: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const parse = ProfileSchema.safeParse(body)
  if (!parse.success) return NextResponse.json({ error: parse.error }, { status: 422 })
  const admin = await createAdminClient()
  const { data, error } = await admin.from('profiles').insert([parse.data]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
