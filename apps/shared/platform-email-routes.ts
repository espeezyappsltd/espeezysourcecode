/**
 * Cloudflare Email Routing — enabled subdomains on espeezy.com.
 * Keep in sync with the Cloudflare dashboard (Email Routing → Subaddresses).
 */

export const ESPEEZY_EMAIL_DOMAIN = 'espeezy.com'

/** All CF-routed mailbox prefixes (subaddress = local-part @ espeezy.com). */
export const CF_EMAIL_PREFIXES = [
  'admin',
  'newsletter',
  'marketing',
  'panel',
  'promos',
  'news',
  'email',
  'notifications',
  'feedback',
  'orders',
  'billing',
  'support',
  'help',
  'contact',
  'hello',
  'info',
] as const

export type CfEmailPrefix = (typeof CF_EMAIL_PREFIXES)[number]

export function espeezyMailbox(prefix: CfEmailPrefix | string): string {
  return `${prefix}@${ESPEEZY_EMAIL_DOMAIN}`
}

/** Product mapping for outbound / inbound handling */
export const ESPEEZY_MAILBOX = {
  admin: espeezyMailbox('admin'),
  newsletter: espeezyMailbox('newsletter'),
  marketing: espeezyMailbox('marketing'),
  panel: espeezyMailbox('panel'),
  promos: espeezyMailbox('promos'),
  news: espeezyMailbox('news'),
  email: espeezyMailbox('email'),
  notifications: espeezyMailbox('notifications'),
  feedback: espeezyMailbox('feedback'),
  orders: espeezyMailbox('orders'),
  billing: espeezyMailbox('billing'),
  support: espeezyMailbox('support'),
  help: espeezyMailbox('help'),
  contact: espeezyMailbox('contact'),
  hello: espeezyMailbox('hello'),
  info: espeezyMailbox('info'),
} as const

/** Espeezy Studios — job delivery, invoice & receipt */
export const STUDIO_EMAIL = {
  /** Outbound FROM for delivery packages (invoices/receipts) */
  deliveryFrom: ESPEEZY_MAILBOX.billing,
  /** Reply-To on client delivery emails */
  deliveryReplyTo: ESPEEZY_MAILBOX.hello,
  /** Inbound worker forwards to this mailbox */
  inboundForwardTo: ESPEEZY_MAILBOX.support,
  /** Auto-reply FROM when clients email studio routes */
  autoReplyFrom: ESPEEZY_MAILBOX.hello,
  /** Panel / studio app identity */
  panel: ESPEEZY_MAILBOX.panel,
  /** Transactional notifications */
  notifications: ESPEEZY_MAILBOX.notifications,
} as const
