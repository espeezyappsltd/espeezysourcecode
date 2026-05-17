import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db'
import { getAdminDb } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STORAGE_QUOTAS_BYTES: Record<string, number> = {
  free: 1024 * 1024 * 1024,
  pro: 5 * 1024 * 1024 * 1024,
  premium: 20 * 1024 * 1024 * 1024,
  lifetime: 20 * 1024 * 1024 * 1024,
  admin: 100 * 1024 * 1024 * 1024,
}

export async function GET() {
  const db = await createServerSupabaseClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminDb()

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('subscription_plan, subscription_status, storage_used, group_id, total_score')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? 'Profile not found' }, { status: 500 })
  }

  const tier = (profile.subscription_plan ?? 'free').toLowerCase()
  const quotaBytes = STORAGE_QUOTAS_BYTES[tier] ?? STORAGE_QUOTAS_BYTES.free
  const storageUsed = profile.storage_used ?? 0

  let groupTasks = 0
  let myOpenTasks = 0

  if (profile.group_id) {
    const [{ count: groupCount }, { count: openCount }] = await Promise.all([
      admin
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', profile.group_id),
      admin
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', profile.group_id)
        .contains('assignees', [user.id])
        .neq('status', 'Done'),
    ])

    groupTasks = groupCount ?? 0
    myOpenTasks = openCount ?? 0
  }

  const { count: assetCount } = await admin
    .from('personal_assets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return NextResponse.json({
    tier,
    subscriptionStatus: profile.subscription_status ?? 'active',
    storageUsedBytes: storageUsed,
    storageQuotaBytes: quotaBytes,
    storagePercent: Math.min(100, Math.round((storageUsed / quotaBytes) * 100)),
    groupTasks,
    myOpenTasks,
    personalAssets: assetCount ?? 0,
    contributionScore: profile.total_score ?? 0,
  })
}
