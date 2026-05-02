import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const db = await createServerSupabaseClient()

  // Destroy the local authentication session globally on the server.
  await db.auth.signOut()

  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })
}
