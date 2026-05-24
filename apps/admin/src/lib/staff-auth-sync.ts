import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminMember } from '@/lib/admin-rbac'

export type StaffAuthSyncResult =
  | { ok: true; userId: string; repaired: boolean }
  | { ok: false; error: string }

async function findAuthUserIdByEmail(svc: SupabaseClient, email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  let page = 1
  const perPage = 200

  while (page <= 10) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users ?? []
    const match = users.find((u) => u.email?.trim().toLowerCase() === normalized)
    if (match?.id) return match.id
    if (users.length < perPage) break
    page += 1
  }
  return null
}

/**
 * Ensures admin_members.id === auth.users.id for roster email (required for panel access).
 */
export async function ensureStaffAuthUser(
  svc: SupabaseClient,
  member: AdminMember,
  options?: { createIfMissing?: boolean; password?: string },
): Promise<StaffAuthSyncResult> {
  const email = member.email.trim().toLowerCase()
  let userId = await findAuthUserIdByEmail(svc, email)
  let repaired = false

  if (!userId && options?.createIfMissing !== false) {
    const fallbackPassword =
      options?.password ??
      process.env.SEED_ADMIN_PASSWORD?.trim() ??
      `Tmp-${crypto.randomUUID().slice(0, 12)}!1`

    const { data: created, error } = await svc.auth.admin.createUser({
      email,
      password: fallbackPassword,
      email_confirm: true,
      user_metadata: {
        full_name: member.display_name ?? member.username,
        username: member.username,
      },
    })
    if (error) {
      return { ok: false, error: `Could not create auth user: ${error.message}` }
    }
    userId = created.user.id
  }

  if (!userId) {
    return { ok: false, error: `No Supabase auth user for ${email}. Run npm run seed:staff in apps/admin.` }
  }

  if (member.id !== userId) {
    repaired = true
    const { data: totpRow } = await svc
      .from('admin_members')
      .select('totp_secret_enc, totp_enrolled_at')
      .eq('id', member.id)
      .maybeSingle()

    await svc.from('admin_login_otps').delete().eq('admin_member_id', member.id)
    await svc.from('admin_members').delete().eq('id', member.id)

    const { error: memberError } = await svc.from('admin_members').upsert(
      {
        id: userId,
        profile_id: userId,
        username: member.username,
        email: member.email,
        admin_role: member.admin_role,
        display_name: member.display_name,
        title: member.title,
        phone: member.phone,
        is_active: true,
        totp_secret_enc: totpRow?.totp_secret_enc ?? null,
        totp_enrolled_at: totpRow?.totp_enrolled_at ?? null,
      },
      { onConflict: 'id' },
    )
    if (memberError) {
      return { ok: false, error: `Could not link staff roster: ${memberError.message}` }
    }
  }

  const profileRole = member.admin_role === 'admin' ? 'admin' : member.admin_role

  await svc.from('profiles').upsert(
    {
      id: userId,
      email: member.email,
      full_name: member.display_name ?? member.username,
      role: profileRole,
    },
    { onConflict: 'id' },
  )

  return { ok: true, userId, repaired }
}
