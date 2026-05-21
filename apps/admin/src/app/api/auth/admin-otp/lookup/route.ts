import { NextResponse } from 'next/server'
import { normalizeAdminUsername } from '@/lib/admin-rbac'
import { staffPhoneHint } from '@/lib/admin-login-otp'
import { createAdminClient } from '@/lib/db'
import { getAdminMemberByUsername } from '@/utils/admin-auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const normalized = normalizeAdminUsername(username)

  if (normalized.length < 3) {
    return NextResponse.json({ error: 'Enter a valid staff username' }, { status: 400 })
  }

  const svc = await createAdminClient()
  const member = await getAdminMemberByUsername(normalized, svc)

  if (!member?.phone) {
    return NextResponse.json(
      {
        error:
          'This username has no registered phone. Ask your platform lead to add your number on the staff roster.',
      },
      { status: 400 },
    )
  }

  return NextResponse.json({
    ok: true,
    phoneHint: staffPhoneHint(member),
    displayName: member.display_name ?? member.username,
  })
}
