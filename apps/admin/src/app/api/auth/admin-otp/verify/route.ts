import { NextResponse } from 'next/server'
import { normalizeAdminUsername } from '@/lib/admin-rbac'
import {
  ADMIN_OTP_MAX_VERIFY_ATTEMPTS,
  memberRosterEmail,
  verifyAdminOtpCode,
} from '@/lib/admin-login-otp'
import { ensureStaffAuthUser } from '@/lib/staff-auth-sync'
import { createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { getAdminMemberByUserId, getAdminMemberByUsername } from '@/utils/admin-auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '').slice(0, 6) : ''
  const normalized = normalizeAdminUsername(username)

  if (normalized.length < 3 || code.length !== 6) {
    return NextResponse.json({ error: 'Username and 6-digit code are required' }, { status: 400 })
  }

  const svc = await createAdminClient()
  let member = await getAdminMemberByUsername(normalized, svc)
  const email = member ? memberRosterEmail(member) : null

  if (!member || !email) {
    return NextResponse.json({ error: 'Invalid login' }, { status: 401 })
  }

  const { data: otpRow } = await svc
    .from('admin_login_otps')
    .select('id, code_hash, attempts, expires_at')
    .eq('admin_member_id', member.id)
    .eq('email', email)
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

  const authSync = await ensureStaffAuthUser(svc, member, { createIfMissing: true })
  if (!authSync.ok) {
    return NextResponse.json({ error: authSync.error }, { status: 500 })
  }

  const authUserId = authSync.userId
  member = (await getAdminMemberByUserId(authUserId, svc)) ?? member

  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email: member.email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: linkError?.message ?? 'Could not complete sign in' },
      { status: 500 },
    )
  }

  const db = await createServerSupabaseClient()
  const { error: sessionError } = await db.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  })

  if (sessionError) {
    return NextResponse.json({ error: `Could not complete sign in: ${sessionError.message}` }, { status: 500 })
  }

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Session was not created. Try again.' }, { status: 500 })
  }

  const rosterMember = await getAdminMemberByUserId(user.id, svc)
  if (!rosterMember) {
    await db.auth.signOut()
    return NextResponse.json(
      {
        error:
          'Signed in, but this account is not on the staff roster. Ask your platform lead to run staff seed for your email.',
      },
      { status: 403 },
    )
  }

  await svc
    .from('admin_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id)

  await svc.from('chat_events').insert({
    app_scope: 'admin',
    event_type: 'join',
    username: rosterMember.username,
    supabase_user_id: user.id,
    details: { at: new Date().toISOString(), method: 'email_otp', auth_repaired: authSync.repaired },
  })

  return NextResponse.json({
    ok: true,
    username: rosterMember.username,
    role: rosterMember.admin_role,
    display_name: rosterMember.display_name,
  })
}
