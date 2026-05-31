/** Mirror of apps/shared/platform-email-routes.ts (worker bundle). */

export const STUDIO_FROM = 'billing@espeezy.com'
export const STUDIO_REPLY_TO = 'hello@espeezy.com'
export const INBOUND_FORWARD_TO = 'support@espeezy.com'
export const AUTO_REPLY_FROM = 'hello@espeezy.com'

/** Inbound: prefix → forward target when worker handles multiple routes */
export const INBOUND_ROUTE: Record<string, string> = {
  billing: 'support@espeezy.com',
  orders: 'support@espeezy.com',
  panel: 'support@espeezy.com',
  hello: 'support@espeezy.com',
  email: 'support@espeezy.com',
  feedback: 'support@espeezy.com',
  contact: 'support@espeezy.com',
  help: 'support@espeezy.com',
  support: 'support@espeezy.com',
  admin: 'admin@espeezy.com',
  notifications: 'notifications@espeezy.com',
}

export function forwardTargetForRecipient(to: string, fallback: string): string {
  const local = to.split('@')[0]?.toLowerCase() ?? ''
  const base = local.split('+')[0]
  return INBOUND_ROUTE[base] ?? fallback
}
