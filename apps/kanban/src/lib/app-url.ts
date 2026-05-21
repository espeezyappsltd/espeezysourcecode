import {
  ESPEEZY_APP_ORIGINS,
  buildAuthCallbackUrl,
  buildKanbanAppUrl,
  isEmbedPreview,
  resolveClientOrigin,
  resolveLegacyKanbanPath,
  resolveRequestOrigin,
  sanitizeKanbanNextPath,
  sanitizeNextPath,
  shouldForwardAuthToKanban,
} from '@shared/app-url'

export {
  ESPEEZY_APP_ORIGINS,
  buildAuthCallbackUrl,
  buildKanbanAppUrl,
  isEmbedPreview,
  resolveClientOrigin,
  resolveLegacyKanbanPath,
  resolveRequestOrigin,
  sanitizeKanbanNextPath,
  sanitizeNextPath,
  shouldForwardAuthToKanban,
}

export function getKanbanOrigin(request?: Request | null): string {
  return resolveRequestOrigin(request, ESPEEZY_APP_ORIGINS.kanban)
}
