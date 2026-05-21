import { resolvePanelOrigin } from '@shared/app-url'

export {
  ESPEEZY_APP_ORIGINS,
  buildAdminLoginUrl,
  buildAuthCallbackUrl,
  resolveAdminAppOrigin,
  resolvePanelOrigin,
  resolveRequestOrigin,
  sanitizeNextPath,
  shouldForwardAuthToPanel,
} from '@shared/app-url'

/** Public base URL for emails, Stripe return URLs, and password reset links. */
export function getAdminPublicUrl(): string {
  return resolvePanelOrigin(null)
}
