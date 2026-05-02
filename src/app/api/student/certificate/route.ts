/**
 * POST /api/student/certificate
 * Generate a digital certificate (PDF) for a graduating student and store
 * the record in the `certificates` table. Sends an email with download link.
 *
 * Body:
 *   { program_name: string; graduation_year?: number; gpa?: number; achievements?: string[] }
 *
 * Requires: active (approved) student verification for the user.
 *
 * GET /api/student/certificate
 * Returns all certificates for the authenticated user.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { sendCertificateEmail } from '@/services/email'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://espeezy.com'

export async function POST(req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const programName: string = (body.program_name ?? '').slice(0, 200).trim()
  if (!programName) return NextResponse.json({ error: 'program_name is required' }, { status: 400 })

  const graduationYear: number | null = typeof body.graduation_year === 'number'
    ? body.graduation_year : null
  const gpa: number | null = typeof body.gpa === 'number' ? body.gpa : null
  const achievements: string[] = Array.isArray(body.achievements)
    ? body.achievements.slice(0, 10).map((a: unknown) => String(a).slice(0, 80)) : []

  const svc = await createAdminClient()

  // Verify the user has an approved student verification
  const { data: verification } = await svc
    .from('student_verifications')
    .select('id, institution, academic_year')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!verification) {
    return NextResponse.json(
      { error: 'Active approved student verification required before issuing a certificate' },
      { status: 403 }
    )
  }

  // Fetch the user's profile for display name
  const { data: profile } = await svc
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const displayName: string = profile?.display_name ?? user.email?.split('@')[0] ?? 'Scholar'
  const email: string = profile?.email ?? user.email ?? ''

  // Create the certificate record
  const { data: cert, error: certErr } = await svc
    .from('certificates')
    .insert({
      user_id: user.id,
      program_name: programName,
      graduation_year: graduationYear,
      gpa,
      achievements,
    })
    .select('id, issue_date')
    .single()

  if (certErr) return NextResponse.json({ error: certErr.message }, { status: 500 })

  // Generate a blockchain-style integrity hash
  const hash = createHash('sha256')
    .update(`${cert.id}:${user.id}:${programName}:${cert.issue_date}`)
    .digest('hex')

  await svc.from('certificates').update({ blockchain_hash: hash }).eq('id', cert.id)

  const verifyUrl = `${APP_URL}/certificate/${cert.id}`

  // Send email notification (fire-and-forget)
  if (email) {
    sendCertificateEmail({ to: email, displayName, certificateId: cert.id, programName, verifyUrl })
      .catch(() => {})
  }

  return NextResponse.json({
    id: cert.id,
    program_name: programName,
    issue_date: cert.issue_date,
    blockchain_hash: hash,
    verify_url: verifyUrl,
    download_url: `${APP_URL}/api/student/certificate/${cert.id}/pdf`,
  }, { status: 201 })
}

export async function GET() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = await createAdminClient()
  const { data, error } = await svc
    .from('certificates')
    .select('id, program_name, issue_date, graduation_year, achievements, blockchain_hash, revoked, created_at')
    .eq('user_id', user.id)
    .eq('revoked', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
