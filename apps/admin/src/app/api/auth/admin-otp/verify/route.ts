import { NextResponse } from 'next/server'
import { normalizeAdminUsername } from '@/lib/admin-rbac'
import {
  ADMIN_OTP_MAX_VERIFY_ATTEMPTS,
  normalizeStaffPhone,
  staffPhoneMatches,
  verifyAdminOtpCode,
} from '@/lib/admin-login-otp'
import { createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { getAdminMemberByUsername } from '@/utils/admin-auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const phone = typeof body.phone === 'string' ? body.phone : ''
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '').slice(0, 6) : ''
  const normalized = normalizeAdminUsername(username)

  if (normalized.length < 3 || code.length !== 6) {
    return NextResponse.json({ error: 'Username and 6-digit code are required' }, { status: 400 })
  }

  const phoneE164 = normalizeStaffPhone(phone)
  if (!phoneE164) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const svc = await createAdminClient()
  const member = await getAdminMemberByUsername(normalized, svc)

  if (!member || !staffPhoneMatches(member, phone)) {
    return NextResponse.json({ error: 'Invalid login' }, { status: 401 })
  }

  const { data: otpRow } = await svc
    .from('admin_login_otps')
    .select('id, code_hash, attempts, expires_at')
    .eq('admin_member_id', member.id)
    .eq('phone_e164', phoneE164)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!otpRow) {
    return NextResponse.json({ error: 'Code expired or not found. Request a new one.' }, { status: 401 })
  }

  if (otpRow.attempts >= ADMIN_OTP_MAX_VERIFY_ATTEMPTS) {
    return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 })
  }

  if (!verifyAdminOtpCode(code, otpRow.code_hash)) {
    await svc
      .from('admin_login_otps')
      .update({ attempts: otpRow.attempts + 1 })
      .eq('id', otpRow.id)
    return NextResponse.json({ error: 'Incorrect code' }, { status: 401 })
  }

  await svc.from('admin_login_otps').update({ consumed_at: new Date().toISOString() }).eq('id', otpRow.id)

  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email: member.email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: 'Could not complete sign in' }, { status: 500 })
  }

  const db = await createServerSupabaseClient()
  const { error: sessionError } = await db.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  })

  if (sessionError) {
    return NextResponse.json({ error: 'Could not complete sign in' }, { status: 500 })
  }

  await svc
    .from('admin_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', member.id)

  await svc.from('chat_events').insert({
    app_scope: 'admin',
    event_type: 'join',
    username: member.username,
    supabase_user_id: member.id,
    details: { at: new Date().toISOString(), method: 'phone_otp' },
  })

  return NextResponse.json({
    ok: true,
    username: member.username,
    role: member.admin_role,
    display_name: member.display_name,
  })
}
