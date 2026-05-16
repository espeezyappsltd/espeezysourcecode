import { NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'
import { fetchPlanCounts, fetchRoleCounts, fetchSignupChart } from '@/utils/analytics-aggregates'
import { CACHE_HEADERS, getCached } from '@/utils/server-cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  const payload = await getCached('admin:analytics', 30_000, async () => {
    const svc = ctx.svc

    const [
      { count: totalUsers },
      { count: proUsers },
      { count: premiumUsers },
      { count: lifetimeUsers },
      { count: bannedUsers },
      { count: totalGroups },
      { count: activeGroups },
      { count: totalTasks },
      { count: doneTasks },
      { data: recentSignups },
      roleCounts,
      planCounts,
      signupChart,
    ] = await Promise.all([
      svc.from('profiles').select('id', { count: 'exact', head: true }),
      svc.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_plan', 'pro'),
      svc.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_plan', 'premium'),
      svc.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_plan', 'lifetime'),
      svc.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
      svc.from('groups').select('id', { count: 'exact', head: true }),
      svc.from('groups').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      svc.from('tasks').select('id', { count: 'exact', head: true }),
      svc.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'Done'),
      svc
        .from('profiles')
        .select('id, full_name, email, subscription_plan, created_at, role, avatar_url')
        .order('created_at', { ascending: false })
        .limit(10),
      fetchRoleCounts(svc),
      fetchPlanCounts(svc),
      fetchSignupChart(svc),
    ])

    const mrr = (proUsers ?? 0) * 4.99 + (premiumUsers ?? 0) * 14.99 + (lifetimeUsers ?? 0) * 2.99

    return {
      overview: {
        totalUsers: totalUsers ?? 0,
        proUsers: proUsers ?? 0,
        premiumUsers: (premiumUsers ?? 0) + (lifetimeUsers ?? 0),
        bannedUsers: bannedUsers ?? 0,
        totalGroups: totalGroups ?? 0,
        activeGroups: activeGroups ?? 0,
        totalTasks: totalTasks ?? 0,
        doneTasks: doneTasks ?? 0,
        mrr,
      },
      roleCounts,
      planCounts,
      signupChart,
      recentSignups: recentSignups ?? [],
    }
  })

  return NextResponse.json(payload, { headers: CACHE_HEADERS.private })
}
