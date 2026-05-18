import { Q } from '@/lib/query-columns'
import { enrichHustleTasks, type HustleTaskWithProfiles } from '@/lib/hustle/task-enrich'
import { matchesClientSearch } from '@/lib/hustle/gig-ux'
import { HUSTLE_CATEGORIES } from '@/lib/hustle/task-validation'

export type MyGigRole = 'applicant' | 'assignee'

export type MyGigTask = HustleTaskWithProfiles & {
  my_role: MyGigRole
  application_status: string | null
  application_message: string | null
  application_created_at: string | null
}

export async function fetchMyGigTasks(
  adminDb: ReturnType<typeof import('@/lib/supabase/admin').getAdminDb>,
  userId: string,
  opts?: {
    cursor?: string | null
    limit?: number
    category?: string
    q?: string
  },
): Promise<{ tasks: MyGigTask[]; nextCursor: string | null }> {
  const limit = opts?.limit ?? 40
  const [{ data: applications, error: appErr }, { data: assignedRows, error: assignErr }] =
    await Promise.all([
      adminDb
        .from('hustle_task_applications')
        .select('task_id, status, message, created_at')
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false }),
      adminDb.from('hustle_tasks').select(Q.hustleTask).eq('assignee_id', userId),
    ])

  if (appErr && !appErr.message.includes('hustle_task_applications')) throw appErr
  if (assignErr) throw assignErr

  const appByTask = new Map(
    (applications ?? []).map((a) => [
      a.task_id as string,
      {
        status: a.status as string,
        message: (a.message as string | null) ?? null,
        created_at: a.created_at as string,
      },
    ]),
  )

  const taskIdSet = new Set<string>([
    ...appByTask.keys(),
    ...(assignedRows ?? []).map((r) => r.id as string),
  ])

  if (taskIdSet.size === 0) return { tasks: [], nextCursor: null }

  const { data: taskRows, error: taskErr } = await adminDb
    .from('hustle_tasks')
    .select(Q.hustleTask)
    .in('id', Array.from(taskIdSet))

  if (taskErr) throw taskErr

  const enriched = await enrichHustleTasks(adminDb, taskRows ?? [])

  let list: MyGigTask[] = enriched.map((task) => {
    const isAssignee = task.assignee_id === userId
    const app = appByTask.get(task.id)
    return {
      ...task,
      my_role: isAssignee ? 'assignee' : 'applicant',
      application_status: isAssignee ? 'accepted' : app?.status ?? null,
      application_message: app?.message ?? null,
      application_created_at: app?.created_at ?? null,
    }
  })

  if (
    opts?.category &&
    opts.category !== 'all' &&
    HUSTLE_CATEGORIES.includes(opts.category as (typeof HUSTLE_CATEGORIES)[number])
  ) {
    list = list.filter((t) => t.category === opts.category)
  }

  if (opts?.q?.trim()) {
    list = list.filter((t) => matchesClientSearch(t, opts.q!))
  }

  list.sort(
    (a, b) =>
      new Date(b.updated_at ?? b.created_at).getTime() -
      new Date(a.updated_at ?? a.created_at).getTime(),
  )

  if (opts?.cursor) {
    const cursorMs = new Date(opts.cursor).getTime()
    list = list.filter((t) => new Date(t.updated_at ?? t.created_at).getTime() < cursorMs)
  }

  const hasMore = list.length > limit
  const page = hasMore ? list.slice(0, limit) : list
  const last = page[page.length - 1]
  return {
    tasks: page,
    nextCursor: hasMore && last ? (last.updated_at ?? last.created_at) : null,
  }
}

export async function fetchPostedTasks(
  adminDb: ReturnType<typeof import('@/lib/supabase/admin').getAdminDb>,
  userId: string,
  opts: { category?: string; q?: string; cursor?: string | null; limit: number },
): Promise<{ tasks: HustleTaskWithProfiles[]; nextCursor: string | null }> {
  const { buildHustleSearchOr, HUSTLE_CATEGORIES } = await import('@/lib/hustle/task-validation')

  let query = adminDb
    .from('hustle_tasks')
    .select(Q.hustleTask)
    .eq('poster_id', userId)
    .order('created_at', { ascending: false })
    .limit(opts.limit + 1)

  if (
    opts.category &&
    opts.category !== 'all' &&
    HUSTLE_CATEGORIES.includes(opts.category as (typeof HUSTLE_CATEGORIES)[number])
  ) {
    query = query.eq('category', opts.category)
  }

  const searchOr = buildHustleSearchOr(opts.q ?? '')
  if (searchOr) query = query.or(searchOr)
  if (opts.cursor) query = query.lt('created_at', opts.cursor)

  const { data: rows, error } = await query
  if (error) throw error

  const tasks = await enrichHustleTasks(adminDb, rows ?? [])
  const hasMore = tasks.length > opts.limit
  const finalTasks = hasMore ? tasks.slice(0, opts.limit) : tasks
  return {
    tasks: finalTasks,
    nextCursor: hasMore ? finalTasks[finalTasks.length - 1].created_at : null,
  }
}
