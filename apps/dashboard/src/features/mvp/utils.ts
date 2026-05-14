export function initials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

export function avatarColor(email: string) {
  const colors = ['#10b981', '#059669', '#34d399', '#f59e0b', '#ef4444', '#f97316', '#0ea5a4']
  let hash = 0

  for (let index = 0; index < email.length; index += 1) {
    hash = (hash * 31 + email.charCodeAt(index)) & 0xfffffff
  }

  return colors[hash % colors.length]
}

export function relativeTime(timestamp: number, now = Date.now()) {
  const seconds = Math.floor((now - timestamp) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`

  return `${Math.floor(seconds / 86400)}d ago`
}

export function toCsvLine(values: string[]) {
  return values.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')
}
