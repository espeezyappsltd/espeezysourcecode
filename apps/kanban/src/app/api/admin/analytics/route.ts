import { NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  const svc = ctx.svc

  // Run all stat queries in parallel
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
    { data: roleDistribution },
    { data: planDistribution },
    { data: dailySignups },
  ] = await Promise.all([
    svc.from('profiles').select('*', { count: 'exact', head: true }),
    svc.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_plan', 'pro'),
    svc.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_plan', 'premium'),
    svc.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_plan', 'lifetime'),
    svc.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
    svc.from('groups').select('*', { count: 'exact', head: true }),
    svc.from('groups').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    svc.from('tasks').select('*', { count: 'exact', head: true }),
    svc.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Done'),
    svc.from('profiles')
      .select('id, full_name, email, subscription_plan, created_at, role, avatar_url')
      .order('created_at', { ascending: false })
      .limit(10),
    svc.from('profiles').select('role').neq('role', null),
    svc.from('profiles').select('subscription_plan').neq('subscription_plan', null),
    svc.from('profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),
  ])

  // Aggregate role counts
  const roleRows = (roleDistribution ?? []) as Array<{ role: string }>
  const roleCounts = roleRows.reduce<Record<string, number>>((acc, p) => {
    const r = p.role ?? 'unknown'
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})

  // Aggregate plan counts
  const planRows = (planDistribution ?? []) as Array<{ subscription_plan: string }>
  const planCounts = planRows.reduce<Record<string, number>>((acc, p) => {
    const plan = p.subscription_plan ?? 'free'
    acc[plan] = (acc[plan] ?? 0) + 1
    return acc
  }, {})

  // Build daily signups chart data (last 30 days)
  const signupsByDay: Record<string, number> = {}
  const signupRows = (dailySignups ?? []) as Array<{ created_at: string }>
  signupRows.forEach((p) => {
    const day = new Date(p.created_at).toISOString().split('T')[0]
    signupsByDay[day] = (signupsByDay[day] ?? 0) + 1
  })
  const signupChart = Object.entries(signupsByDay).map(([date, count]) => ({ date, count }))

  // Estimated MRR
  const mrr = (proUsers ?? 0) * 4.99 + (premiumUsers ?? 0) * 14.99 + (lifetimeUsers ?? 0) * 2.99

  return NextResponse.json({
    overview: {
      totalUsers:   totalUsers ?? 0,
      proUsers:     proUsers ?? 0,
      premiumUsers: (premiumUsers ?? 0) + (lifetimeUsers ?? 0),
      bannedUsers:  bannedUsers ?? 0,
      totalGroups:  totalGroups ?? 0,
      activeGroups: activeGroups ?? 0,
      totalTasks:   totalTasks ?? 0,
      doneTasks:    doneTasks ?? 0,
      mrr,
    },
    roleCounts,
    planCounts,
    signupChart,
    recentSignups: recentSignups ?? [],
  })
}
