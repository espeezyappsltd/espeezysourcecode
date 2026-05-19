import type { ActivityLogRow } from '@/types/database'

function csvEscape(cell: unknown): string {
  return `"${String(cell ?? '').replace(/"/g, '""')}"`
}

export function buildActivityLogCsv(logs: ActivityLogRow[]): string {
  const lines = [
    ['Timestamp', 'Action', 'User', 'Scope', 'Description', 'Status']
      .map(csvEscape)
      .join(','),
  ]
  logs.forEach((l) => {
    lines.push(
      [
        l.created_at,
        l.action_type || l.action,
        l.user_name || 'System',
        l.group_id ? 'team' : 'personal',
        l.description || l.message || '',
        (l as { status?: string }).status ?? 'success',
      ]
        .map(csvEscape)
        .join(','),
    )
  })
  return lines.join('\n')
}

export function downloadTextFile(content: string, filename: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
