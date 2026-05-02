/**
 * GET /api/cron/expire-verifications
 * Marks student_verifications as 'expired' when expires_at has passed.
 *
 * Configured in vercel.json as a Vercel Cron Job running daily at 03:00 UTC.
 * Protected by CRON_SECRET header.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const svc = await createAdminClient()
  const { data, error } = await svc
    .from('student_verifications')
    .update({ status: 'expired' })
    .eq('status', 'approved')
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ expired: data?.length ?? 0 })
}
