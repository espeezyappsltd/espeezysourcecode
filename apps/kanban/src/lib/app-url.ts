import {
  ESPEEZY_APP_ORIGINS,
  buildAuthCallbackUrl,
  resolveClientOrigin,
  resolveRequestOrigin,
  sanitizeNextPath,
  shouldForwardAuthToKanban,
} from '@shared/app-url'

export {
  ESPEEZY_APP_ORIGINS,
  buildAuthCallbackUrl,
  resolveClientOrigin,
  resolveRequestOrigin,
  sanitizeNextPath,
  shouldForwardAuthToKanban,
}

export function getKanbanOrigin(request?: Request | null): string {
  return resolveRequestOrigin(request, ESPEEZY_APP_ORIGINS.kanban)
}
