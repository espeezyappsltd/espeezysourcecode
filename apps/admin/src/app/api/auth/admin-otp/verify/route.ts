import { NextResponse } from 'next/server'
import { normalizeAdminUsername } from '@/lib/admin-rbac'
import {
  ADMIN_TOTP_LOCKOUT_MS,
  ADMIN_TOTP_MAX_VERIFY_ATTEMPTS,
  decryptTotpSecret,
  isAdminTotpDevBypass,
  isPanelTotpDevMode,
  isTotpLocked,
  memberHasTotpEnrolled,
  verifyTotpToken,
} from '@/lib/admin-totp'
import { ensureStaffAuthUser } from '@/lib/staff-auth-sync'
import { createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { getAdminMemberByUserId, getAdminMemberByUsername } from '@/utils/admin-auth'

const MEMBER_TOTP_SELECT =
  'id, profile_id, username, email, admin_role, display_name, title, phone, is_active, last_seen_at, totp_secret_enc, totp_enrolled_at, totp_verify_attempts, totp_locked_until'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '').slice(0, 6) : ''
  const normalized = normalizeAdminUsername(username)

  if (normalized.length < 3 || code.length !== 6) {
    return NextResponse.json({ error: 'Username and 6-digit authenticator code are required' }, { status: 400 })
  }

  const svc = await createAdminClient()
  const { data: row } = await svc
    .from('admin_members')
    .select(MEMBER_TOTP_SELECT)
    .eq('username', normalized)
    .eq('is_active', true)
    .maybeSingle()

  if (!row?.email?.trim()) {
    return NextResponse.json({ error: 'Invalid login' }, { status: 401 })
  }

  let member = row as import('@/lib/admin-rbac').AdminMember

  if (isTotpLocked(member)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Wait 15 minutes or contact your platform lead.' },
      { status: 429 },
    )
  }

  const enrolled = memberHasTotpEnrolled(member)
  const devBypass = isAdminTotpDevBypass(code)

  if (!enrolled && !devBypass) {
    return NextResponse.json(
      {
        error:
          'Authenticator not enrolled for this account. Your platform lead must run npm run seed:admin-totp in apps/admin.',
      },
      { status: 401 },
    )
  }

  if (enrolled && member.totp_secret_enc) {
    const secret = decryptTotpSecret(member.totp_secret_enc)
    if (!secret) {
      return NextResponse.json({ error: 'Could not read authenticator configuration' }, { status: 500 })
    }
    if (!verifyTotpToken(secret, code) && !(isPanelTotpDevMode() && devBypass)) {
      const attempts = (member.totp_verify_attempts ?? 0) + 1
      const updates: Record<string, unknown> = { totp_verify_attempts: attempts }
      if (attempts >= ADMIN_TOTP_MAX_VERIFY_ATTEMPTS) {
        updates.totp_locked_until = new Date(Date.now() + ADMIN_TOTP_LOCKOUT_MS).toISOString()
      }
      await svc.from('admin_members').update(updates).eq('id', member.id)
      return NextResponse.json({ error: 'Incorrect authenticator code' }, { status: 401 })
    }
  } else if (!devBypass) {
    return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 401 })
  }

  await svc
    .from('admin_members')
    .update({
      totp_verify_attempts: 0,
      totp_locked_until: null,
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', member.id)

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
    details: { at: new Date().toISOString(), method: 'totp_authenticator', auth_repaired: authSync.repaired },
  })

  return NextResponse.json({
    ok: true,
    username: rosterMember.username,
    role: rosterMember.admin_role,
    display_name: rosterMember.display_name,
  })
}
