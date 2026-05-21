import { NextResponse } from 'next/server'
import { normalizeAdminUsername } from '@/lib/admin-rbac'
import {
  ADMIN_OTP_MAX_REQUESTS_PER_WINDOW,
  ADMIN_OTP_REQUEST_WINDOW_MS,
  ADMIN_OTP_TTL_MS,
  generateAdminOtpCode,
  hashAdminOtpCode,
  memberRosterEmail,
  staffEmailHint,
} from '@/lib/admin-login-otp'
import { createAdminClient } from '@/lib/db'
import { getAdminMemberByUsername } from '@/utils/admin-auth'
import { deliverAdminLoginOtpEmail } from '@/services/admin-login-notify'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const normalized = normalizeAdminUsername(username)

  if (normalized.length < 3) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }

  const svc = await createAdminClient()
  const member = await getAdminMemberByUsername(normalized, svc)

  if (!member) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 401 })
  }

  const email = memberRosterEmail(member)
  if (!email) {
    return NextResponse.json(
      { error: 'No email on file for this account. Contact your platform lead.' },
      { status: 400 },
    )
  }

  const windowStart = new Date(Date.now() - ADMIN_OTP_REQUEST_WINDOW_MS).toISOString()
  const { count } = await svc
    .from('admin_login_otps')
    .select('id', { count: 'exact', head: true })
    .eq('admin_member_id', member.id)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= ADMIN_OTP_MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: 'Too many codes requested. Try again in a few minutes.' }, { status: 429 })
  }

  await svc
    .from('admin_login_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('admin_member_id', member.id)
    .is('consumed_at', null)

  const code = generateAdminOtpCode()
  const expiresAt = new Date(Date.now() + ADMIN_OTP_TTL_MS).toISOString()

  const { error: insertError } = await svc.from('admin_login_otps').insert({
    admin_member_id: member.id,
    username: member.username,
    email,
    code_hash: hashAdminOtpCode(code),
    expires_at: expiresAt,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Could not start login. Try again.' }, { status: 500 })
  }

  const emailSent = await deliverAdminLoginOtpEmail({
    email,
    username: member.username,
    code,
  })

  if (!emailSent) {
    return NextResponse.json(
      { error: 'Login email is not configured (Resend/SMTP). Contact your platform lead.' },
      { status: 503 },
    )
  }

  if (process.env.ADMIN_OTP_LOG_DEV === 'true' && process.env.NODE_ENV !== 'production') {
    console.info('[admin-otp]', member.username, email, code)
  }

  return NextResponse.json({
    ok: true,
    emailHint: staffEmailHint(member),
    emailSent: true,
  })
}
