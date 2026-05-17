import {
  ESPEEZY_APP_ORIGINS,
  buildAuthCallbackUrl,
  resolveClientOrigin,
  resolveRequestOrigin,
} from '@shared/app-url'

export {
  ESPEEZY_APP_ORIGINS,
  buildAuthCallbackUrl,
  resolveRequestOrigin,
  sanitizeNextPath,
  isEmbedPreview,
  withEmbedPreviewParam,
} from '@shared/app-url'

export function resolveGamesClientOrigin(): string {
  return resolveClientOrigin(ESPEEZY_APP_ORIGINS.games)
}
