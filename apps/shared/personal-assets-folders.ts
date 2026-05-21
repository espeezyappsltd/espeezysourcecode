export const FOLDER_SCHEME = 'espeezy://folder'

export function normalizeFolderPath(raw: string | null | undefined): string {
  const trimmed = (raw ?? '/').trim()
  if (!trimmed || trimmed === '/') return '/'
  const parts = trimmed.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  return '/' + parts.join('/')
}

export function isFolderMarker(row: {
  metadata?: unknown
  asset_url?: string | null
}): boolean {
  const meta = row.metadata as { is_folder?: boolean } | null
  if (meta?.is_folder === true) return true
  return row.asset_url === FOLDER_SCHEME || row.asset_url?.startsWith('espeezy://folder') === true
}

export type PersonalAssetSummary = {
  id: string
  title: string
  asset_type: string
  asset_url: string | null
  folder?: string | null
  metadata?: unknown
}

export type FolderSummary = {
  path: string
  name: string
  fileCount: number
}

const HIDDEN_FILE_TITLES = new Set(['README.txt'])

export function isVaultFile(row: PersonalAssetSummary): boolean {
  return !isFolderMarker(row) && !HIDDEN_FILE_TITLES.has(row.title)
}

/** Top-level folders under `/` with file counts (mirrors Kanban Personal Arsenal). */
export function summarizeTopLevelFolders(assets: PersonalAssetSummary[]): FolderSummary[] {
  const counts = new Map<string, number>()

  for (const asset of assets) {
    if (isFolderMarker(asset)) {
      const meta = asset.metadata as { folder_path?: string } | null
      const fp = normalizeFolderPath(meta?.folder_path ?? asset.folder)
      if (!fp || fp === '/') continue
      const parts = fp.split('/').filter(Boolean)
      const parentPath = parts.length <= 1 ? '/' : '/' + parts.slice(0, -1).join('/')
      if (parentPath === '/') {
        const top = `/${parts[0]}`
        if (!counts.has(top)) counts.set(top, 0)
      }
      continue
    }

    const f = normalizeFolderPath(asset.folder)
    const seg = f.split('/').filter(Boolean)[0]
    if (!seg) continue
    const top = `/${seg}`
    counts.set(top, (counts.get(top) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([path, fileCount]) => ({
      path,
      name: path.replace(/^\//, ''),
      fileCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function countVaultFiles(assets: PersonalAssetSummary[]): number {
  return assets.filter(isVaultFile).length
}
