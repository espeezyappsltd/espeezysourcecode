import { NextResponse } from 'next/server'
import { normalizeAdminUsername } from '@/lib/admin-rbac'
import {
  ADMIN_OTP_MAX_REQUESTS_PER_WINDOW,
  ADMIN_OTP_REQUEST_WINDOW_MS,
  ADMIN_OTP_TTL_MS,
  generateAdminOtpCode,
  hashAdminOtpCode,
  maskStaffPhone,
  normalizeStaffPhone,
  staffPhoneMatches,
} from '@/lib/admin-login-otp'
import { createAdminClient } from '@/lib/db'
import { getAdminMemberByUsername } from '@/utils/admin-auth'
import { deliverAdminLoginOtp } from '@/services/admin-login-notify'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const phone = typeof body.phone === 'string' ? body.phone : ''
  const normalized = normalizeAdminUsername(username)

  if (normalized.length < 3) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }

  const phoneE164 = normalizeStaffPhone(phone)
  if (!phoneE164) {
    return NextResponse.json({ error: 'Enter a valid phone number with country code (e.g. +1…)' }, { status: 400 })
  }

  const svc = await createAdminClient()
  const member = await getAdminMemberByUsername(normalized, svc)

  if (!member) {
    return NextResponse.json({ error: 'Invalid username or phone' }, { status: 401 })
  }

  if (!member.phone) {
    return NextResponse.json(
      { error: 'No phone on file for this account. Contact your platform lead.' },
      { status: 400 },
    )
  }

  if (!staffPhoneMatches(member, phone)) {
    return NextResponse.json({ error: 'Phone number does not match our records' }, { status: 401 })
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
    phone_e164: phoneE164,
    code_hash: hashAdminOtpCode(code),
    expires_at: expiresAt,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Could not start login. Try again.' }, { status: 500 })
  }

  const delivery = await deliverAdminLoginOtp({
    phoneE164,
    email: member.email,
    username: member.username,
    code,
  })

  if (!delivery.sms && !delivery.email) {
    return NextResponse.json(
      { error: 'Login codes are not configured (Resend/Twilio/SMTP). Contact your platform lead.' },
      { status: 503 },
    )
  }

  if (process.env.ADMIN_OTP_LOG_DEV === 'true' && process.env.NODE_ENV !== 'production') {
    console.info('[admin-otp]', member.username, code)
  }

  return NextResponse.json({
    ok: true,
    phoneHint: maskStaffPhone(phoneE164),
    smsSent: delivery.sms,
    emailSent: delivery.email,
  })
}
