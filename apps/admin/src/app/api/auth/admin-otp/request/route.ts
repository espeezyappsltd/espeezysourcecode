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
import { formatSupabaseError } from '@/utils/supabase-errors'
import { ensureStaffAuthUser } from '@/lib/staff-auth-sync'
import { deliverAdminLoginOtpEmail, isPanelOtpDevMode } from '@/services/admin-login-notify'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const normalized = normalizeAdminUsername(username)

  if (normalized.length < 3) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }

  const svc = await createAdminClient()
  let member = await getAdminMemberByUsername(normalized, svc)

  if (!member) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 401 })
  }

  const authSync = await ensureStaffAuthUser(svc, member, { createIfMissing: true })
  if (!authSync.ok) {
    return NextResponse.json({ error: authSync.error }, { status: 500 })
  }

  if (authSync.repaired) {
    member = (await getAdminMemberByUsername(normalized, svc)) ?? member
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

  const { data: otpRow, error: insertError } = await svc
    .from('admin_login_otps')
    .insert({
      admin_member_id: member.id,
      username: member.username,
      email,
      code_hash: hashAdminOtpCode(code),
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (insertError || !otpRow?.id) {
    return NextResponse.json(
      { error: formatSupabaseError(insertError, 'Could not start login. Try again.') },
      { status: 500 },
    )
  }

  const delivery = await deliverAdminLoginOtpEmail({
    email,
    username: member.username,
    code,
    otpId: otpRow.id,
  })

  const devMode = isPanelOtpDevMode()

  if (devMode) {
    console.info('[admin-otp] dev login', {
      username: member.username,
      email,
      code,
      delivery: delivery.ok ? delivery.channel : delivery.error,
    })
  }

  if (!delivery.ok) {
    if (devMode) {
      console.info('[admin-otp] email failed — dev code', { username: member.username, email, code })
      return NextResponse.json({
        ok: true,
        emailHint: staffEmailHint(member),
        emailSent: false,
        devCode: code,
        emailError: delivery.error,
      })
    }
    return NextResponse.json(
      {
        error: `Could not send login email. ${delivery.error} Set RESEND_API_KEY and a verified RESEND_FROM_EMAIL on Vercel.`,
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    ok: true,
    emailHint: staffEmailHint(member),
    emailSent: true,
    channel: delivery.channel,
  })
}
