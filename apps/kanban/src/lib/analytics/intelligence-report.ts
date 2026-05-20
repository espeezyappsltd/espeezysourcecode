import type { ActivityLogRow, Group, Profile, Task } from '@/types/database'

export type AnalyticsKpis = {
  completionRate: number
  doneTasks: number
  totalTasks: number
  inProgressTasks: number
  todoTasks: number
  overdueTasks: number
  riskLevel: string
  evidenceDensity: string
  memberCount: number
  teamCapacity: number
  /** Unique tasks marked Done (board total). */
  uniqueTasksCompleted: number
  /** Sum of per-member Done assignments (can exceed unique when tasks have multiple assignees). */
  assignmentCompletions: number
}

export type ChartSlice = { name: string; value: number; color?: string }
export type CategorySlice = { fullName: string; count: number }
export type MemberSlice = { name: string; completed: number; assigned: number; totalScore: number }

export type MarketplaceTxRow = {
  date: string
  role: 'buyer' | 'seller'
  listingTitle: string
  credits: number
  userName: string
  status: string
}

function csvEscape(cell: unknown): string {
  return `"${String(cell ?? '').replace(/"/g, '""')}"`
}

function row(cells: unknown[]): string {
  return cells.map(csvEscape).join(',')
}

function formatTeamMembers(active: number, capacity: number): string {
  return `${active} of ${capacity}`
}

function formatDueDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatTxDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function resolveAssigneeNames(
  assigneeIds: string[] | undefined,
  members: Pick<Profile, 'id' | 'full_name' | 'email'>[],
): string {
  if (!assigneeIds?.length) return ''
  const byId = new Map(
    members.map((m) => [
      m.id,
      (m.full_name && m.full_name.trim()) ||
        (m.email && m.email.split('@')[0]) ||
        m.id,
    ]),
  )
  return assigneeIds
    .map((id) => byId.get(id) ?? id)
    .filter(Boolean)
    .join('; ')
}

function activityScope(log: ActivityLogRow): string {
  const row = log as ActivityLogRow & {
    app_scope?: string
    resource_type?: string
  }
  if (row.app_scope) return row.app_scope
  return log.group_id ? 'team' : 'personal'
}

function activityStatus(log: ActivityLogRow): string {
  const row = log as ActivityLogRow & { status?: string }
  return row.status ?? 'success'
}

export function buildIntelligenceReportCsv(input: {
  group: Group | null
  kpis: AnalyticsKpis
  statusPie: ChartSlice[]
  categoryBar: CategorySlice[]
  memberBar: MemberSlice[]
  tasks: Task[]
  members: Profile[]
  activityLogs: ActivityLogRow[]
  marketplaceTx: MarketplaceTxRow[]
}): string {
  const lines: string[] = []
  const push = (...cells: unknown[]) => lines.push(row(cells))
  const blank = () => lines.push('')

  push('ESPEEZY PROJECT INTELLIGENCE REPORT')
  push('Team', input.group?.name ?? 'Project')
  push('Module', input.group?.module_code ?? '')
  push('Generated', new Date().toISOString())
  blank()

  push('=== KEY METRICS ===')
  push('Metric', 'Value')
  push('Completion rate %', input.kpis.completionRate)
  push('Completed tasks', `${input.kpis.doneTasks}/${input.kpis.totalTasks}`)
  push('In progress', input.kpis.inProgressTasks)
  push('To do', input.kpis.todoTasks)
  push('Overdue', input.kpis.overdueTasks)
  push('Risk level', input.kpis.riskLevel)
  push('Evidence density', input.kpis.evidenceDensity)
  push('Team members', formatTeamMembers(input.kpis.memberCount, input.kpis.teamCapacity))
  push('Unique tasks completed', input.kpis.uniqueTasksCompleted)
  push('Assignment completions (team)', input.kpis.assignmentCompletions)
  blank()

  push('=== TASK STATUS (CHART DATA) ===')
  push('Status', 'Count')
  input.statusPie.forEach((s) => push(s.name, s.value))
  blank()

  push('=== TASKS BY CATEGORY (CHART DATA) ===')
  push('Category', 'Count')
  input.categoryBar.forEach((c) => push(c.fullName, c.count))
  blank()

  push('=== MEMBER CONTRIBUTION (CHART DATA) ===')
  push('Member', 'Completed', 'Assigned', 'Total score')
  input.memberBar.forEach((m) => push(m.name, m.completed, m.assigned, m.totalScore))
  blank()

  push('=== ALL TASKS ===')
  push('Title', 'Status', 'Category', 'Due date', 'Assignees')
  input.tasks.forEach((t) => {
    push(
      t.title,
      t.status,
      t.category ?? '',
      formatDueDate(t.due_date),
      resolveAssigneeNames(t.assignees, input.members),
    )
  })
  blank()

  push('=== MARKETPLACE & CREDIT TRANSACTIONS (TEAM) ===')
  push('Date', 'Role', 'Listing', 'Credits', 'User', 'Status')
  if (input.marketplaceTx.length === 0) {
    push('—', '—', '(No team marketplace transactions recorded)', '—', '—', '—')
  } else {
    input.marketplaceTx.forEach((tx) =>
      push(
        formatTxDate(tx.date),
        tx.role,
        tx.listingTitle,
        tx.credits,
        tx.userName,
        tx.status,
      ),
    )
  }
  blank()

  push('=== ACTIVITY LOG ===')
  push('Timestamp', 'Type', 'User', 'Scope', 'Description', 'Status')
  if (input.activityLogs.length === 0) {
    push('—', '—', '—', '—', '(No activity log entries for this team)', '—')
  } else {
    input.activityLogs.forEach((l) => {
      push(
        l.created_at,
        l.action_type || l.action,
        l.user_name || 'System',
        activityScope(l),
        l.description || l.message || '',
        activityStatus(l),
      )
    })
  }
  blank()

  push('=== TEAM ROSTER ===')
  push('Name', 'Role', 'Total score', 'Email')
  input.members.forEach((m) =>
    push(m.full_name || 'Anonymous', m.role, m.total_score ?? 0, m.email ?? ''),
  )

  return `${lines.join('\n')}\n`
}
