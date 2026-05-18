export const FOLDER_SCHEME = 'espeezy://folder'

export function normalizeFolderPath(raw: string | null | undefined): string {
  const trimmed = (raw ?? '/').trim()
  if (!trimmed || trimmed === '/') return '/'
  const parts = trimmed.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  return '/' + parts.join('/')
}

export function joinFolderPath(parent: string, name: string): string {
  const cleanName = name.trim().replace(/[/\\]/g, '')
  if (!cleanName) return normalizeFolderPath(parent)
  const base = normalizeFolderPath(parent)
  return base === '/' ? `/${cleanName}` : `${base}/${cleanName}`
}

export function parentFolderPath(path: string): string {
  const norm = normalizeFolderPath(path)
  if (norm === '/') return '/'
  const parts = norm.split('/').filter(Boolean)
  parts.pop()
  return parts.length ? `/${parts.join('/')}` : '/'
}

export function isFolderMarker(row: {
  metadata?: unknown
  asset_url?: string | null
}): boolean {
  const meta = row.metadata as { is_folder?: boolean } | null
  if (meta?.is_folder === true) return true
  return row.asset_url === FOLDER_SCHEME || row.asset_url?.startsWith('espeezy://folder') === true
}

export function childFolderName(parent: string, childPath: string): string {
  const p = normalizeFolderPath(parent)
  const c = normalizeFolderPath(childPath)
  if (p === '/') return c.replace(/^\//, '')
  if (!c.startsWith(p + '/')) return c.replace(/^\//, '')
  return c.slice(p.length + 1).split('/')[0] ?? c
}
