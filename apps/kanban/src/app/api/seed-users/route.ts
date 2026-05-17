import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase admin credentials for seed-users')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: Request) {
  const secret = process.env.SEED_SECRET
  if (!secret || req.headers.get('x-seed-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let users: unknown
  try {
    users = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(users)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = getAdminClient()
  const results: { email: string; status?: string; error?: string }[] = []

  for (const user of users) {
    const row = user as {
      email: string
      password: string
      roles?: string[]
      [key: string]: unknown
    }
    const { email, password, roles, ...profile } = row

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError && !String(authError.message).includes('already registered')) {
      results.push({ email, error: authError.message })
      continue
    }

    const userId = authUser?.user?.id
    if (userId) {
      await supabase.from('user_profiles').upsert({
        id: userId,
        email,
        roles,
        ...profile,
      })
    }

    results.push({ email, status: 'seeded' })
  }

  return NextResponse.json({ results })
}
