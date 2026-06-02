import { espeezyDocsUrl, espeezyGamesUrl } from '@shared/espeezy-marketing-links'

const LEGACY_DOC_PATHS: Record<string, string> = {
  '/product/roadmap': '/docs/features/roadmap',
  '/product/intelligence': '/docs/features/search',
  '/product/sync': '/docs/infra/sync',
  '/solutions/teams': '/docs/features/network',
  '/solutions/scholars': '/docs/features/kanban',
}

/**
 * Resolve in-app and legacy paths to a working destination (same-origin or absolute docs URL).
 */
export function resolveKanbanNavUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('http')) return trimmed

  const path = trimmed.split('?')[0] ?? trimmed

  if (path.startsWith('/docs') || path in LEGACY_DOC_PATHS || path.startsWith('/product/') || path.startsWith('/solutions/')) {
    const docsPath = LEGACY_DOC_PATHS[path] ?? path
    return espeezyDocsUrl(docsPath)
  }

  if (path === '/chillout' || path.startsWith('/chillout/')) {
    return espeezyGamesUrl('/')
  }

  if (path === '/assets' || path.startsWith('/assets')) {
    return '/settings?tab=storage'
  }

  if (path.startsWith('/feed/manage')) {
    return '/feed?mine=1'
  }

  return trimmed
}

export function isExternalNavUrl(url: string): boolean {
  return url.startsWith('http')
}
