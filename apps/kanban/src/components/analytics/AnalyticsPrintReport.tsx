'use client'

import type { ActivityLogRow, Group, Task } from '@/types/database'
import type { MarketplaceTxRow } from '@/services/dashboard'

type ChartSlice = { name: string; value: number }
type CategorySlice = { fullName: string; count: number }
type MemberSlice = { name: string; completed: number; assigned: number }

export function AnalyticsPrintReport({
  group,
  completionRate,
  doneTasks,
  tasks,
  inProgressTasks,
  todoTasks,
  overdueTasks,
  riskLevel,
  evidenceDensity,
  members,
  totalGroupEffort,
  statusPieData,
  categoryBarData,
  memberBarData,
  marketplaceTx,
  activityLogs,
}: {
  group: Group | null
  completionRate: number
  doneTasks: number
  tasks: Task[]
  inProgressTasks: number
  todoTasks: number
  overdueTasks: number
  riskLevel: string
  evidenceDensity: string
  members: { length: number }
  totalGroupEffort: number
  statusPieData: ChartSlice[]
  categoryBarData: CategorySlice[]
  memberBarData: MemberSlice[]
  marketplaceTx: MarketplaceTxRow[]
  activityLogs: ActivityLogRow[]
}) {
  return (
    <section
      className="analytics-print-only"
      data-testid="analytics-executive-report"
      style={{ display: 'none' }}
    >
      <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.25rem' }}>
        Executive Project Intelligence Report
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#333', marginBottom: '1rem' }}>
        {group?.name} ({group?.module_code}) — Generated {new Date().toLocaleString()}
      </p>

      <div className="analytics-print-section">
        <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Key metrics
        </h2>
        <table className="analytics-print-table">
          <tbody>
            <tr><th>Completion</th><td>{completionRate}%</td></tr>
            <tr><th>Tasks done</th><td>{doneTasks}/{tasks.length}</td></tr>
            <tr><th>In progress / To do</th><td>{inProgressTasks} / {todoTasks}</td></tr>
            <tr><th>Overdue</th><td>{overdueTasks}</td></tr>
            <tr><th>Risk</th><td>{riskLevel}</td></tr>
            <tr><th>Evidence density</th><td>{evidenceDensity}</td></tr>
            <tr><th>Team</th><td>{members.length} of {group?.capacity || 5}</td></tr>
            <tr><th>Assignment completions</th><td>{totalGroupEffort}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="analytics-print-section">
        <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Task status (chart data)
        </h2>
        <table className="analytics-print-table">
          <thead><tr><th>Status</th><th>Count</th></tr></thead>
          <tbody>
            {statusPieData.map((d) => (
              <tr key={d.name}><td>{d.name}</td><td>{d.value}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="analytics-print-section">
        <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          By category (chart data)
        </h2>
        <table className="analytics-print-table">
          <thead><tr><th>Category</th><th>Count</th></tr></thead>
          <tbody>
            {categoryBarData.map((c) => (
              <tr key={c.fullName}><td>{c.fullName}</td><td>{c.count}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="analytics-print-section">
        <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Member contribution (chart data)
        </h2>
        <table className="analytics-print-table">
          <thead><tr><th>Member</th><th>Done</th><th>Assigned</th></tr></thead>
          <tbody>
            {memberBarData.map((m) => (
              <tr key={m.name}><td>{m.name}</td><td>{m.completed}</td><td>{m.assigned}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="analytics-print-section">
        <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          All tasks
        </h2>
        <table className="analytics-print-table">
          <thead><tr><th>Title</th><th>Status</th><th>Category</th><th>Due</th></tr></thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{t.status}</td>
                <td>{t.category ?? '—'}</td>
                <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {marketplaceTx.length > 0 && (
        <div className="analytics-print-section">
          <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Marketplace transactions
          </h2>
          <table className="analytics-print-table">
            <thead><tr><th>Date</th><th>Role</th><th>Listing</th><th>Credits</th><th>User</th></tr></thead>
            <tbody>
              {marketplaceTx.slice(0, 50).map((tx, i) => (
                <tr key={`${tx.date}-${i}`}>
                  <td>{new Date(tx.date).toLocaleString()}</td>
                  <td>{tx.role}</td>
                  <td>{tx.listingTitle}</td>
                  <td>{tx.credits}</td>
                  <td>{tx.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="analytics-print-section">
        <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Activity log
        </h2>
        <table className="analytics-print-table">
          <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Description</th></tr></thead>
          <tbody>
            {activityLogs.slice(0, 80).map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.created_at).toLocaleString()}</td>
                <td>{l.action_type || l.action}</td>
                <td>{l.user_name || 'System'}</td>
                <td>{l.description || l.message || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
