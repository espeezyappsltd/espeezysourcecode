/**
 * POST /api/student/verify
 * Submit a new annual student-status verification request.
 *
 * Body: { institution: string; enrollment_proof?: string; academic_year?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const institution: string = (body.institution ?? '').slice(0, 200).trim()
  if (!institution) return NextResponse.json({ error: 'institution is required' }, { status: 400 })

  const enrollmentProof: string | null = typeof body.enrollment_proof === 'string'
    ? body.enrollment_proof.slice(0, 2048) : null

  // Academic year defaults to current
  const now = new Date()
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const academicYear: string = body.academic_year ?? `${startYear}-${startYear + 1}`

  // Check if there's already an active/pending verification for this year
  const svc = await createAdminClient()
  const { data: existing } = await svc
    .from('student_verifications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('academic_year', academicYear)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: `Verification for ${academicYear} already ${existing.status}`, id: existing.id },
      { status: 409 }
    )
  }

  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const { data: record, error } = await svc
    .from('student_verifications')
    .insert({
      user_id: user.id,
      institution,
      enrollment_proof: enrollmentProof,
      academic_year: academicYear,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('id, status, academic_year, expires_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(record, { status: 201 })
}

/**
 * GET /api/student/verify
 * Return the current user's latest student verification status.
 */
export async function GET() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = await createAdminClient()
  const { data, error } = await svc
    .from('student_verifications')
    .select('id, status, institution, academic_year, expires_at, verified_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
