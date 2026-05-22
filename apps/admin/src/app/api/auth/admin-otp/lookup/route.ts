import { NextResponse } from 'next/server'
import { normalizeAdminUsername } from '@/lib/admin-rbac'
import { memberHasTotpEnrolled, isPanelTotpDevMode } from '@/lib/admin-totp'
import { createAdminClient } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const normalized = normalizeAdminUsername(username)

  if (normalized.length < 3) {
    return NextResponse.json({ error: 'Enter a valid staff username' }, { status: 400 })
  }

  const svc = await createAdminClient()
  const { data: member } = await svc
    .from('admin_members')
    .select('username, display_name, email, totp_secret_enc, totp_enrolled_at, is_active')
    .eq('username', normalized)
    .eq('is_active', true)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Staff username not found' }, { status: 404 })
  }

  const totpEnrolled = memberHasTotpEnrolled(member)

  if (!totpEnrolled && !isPanelTotpDevMode()) {
    return NextResponse.json(
      {
        error:
          'Authenticator not set up for this account. Ask your platform lead to run npm run seed:admin-totp.',
      },
      { status: 400 },
    )
  }

  return NextResponse.json({
    ok: true,
    displayName: member.display_name ?? member.username,
    totpEnrolled,
    authMethod: 'authenticator',
    devMode: isPanelTotpDevMode() && !totpEnrolled,
  })
}
