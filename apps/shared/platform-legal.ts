/**
 * Copyright and legal notices — single source of truth for all Espeezy apps.
 */

export const COPYRIGHT_HOLDER = 'Espeezy'

export const COPYRIGHT_STUDIOS_PRODUCT = 'Espeezy Studios'

export const FOOTER_RIGHTS_RESERVED = 'All rights reserved.'

/** Educative context line shown with copyright on marketing and app footers. */
export const FOOTER_COPYRIGHT_TAGLINE =
  'Collaboration and learning software for university teams, educators, and organizations worldwide.'

/** Optional trademark line for full-width site footers. */
export const FOOTER_TRADEMARK_NOTICE =
  'Espeezy names, logos, and product marks are trademarks of Espeezy. Unauthorized use is prohibited.'

export type CopyrightNoticeOptions = {
  /** Legal product or company name (default: Espeezy). */
  product?: string
  /** Override calendar year (default: current year). */
  year?: number
  /** Include the educative tagline after the rights statement. */
  includeTagline?: boolean
}

/** Primary copyright line for UI footers. */
export function formatCopyrightNotice(options: CopyrightNoticeOptions = {}): string {
  const year = options.year ?? new Date().getFullYear()
  const product = options.product ?? COPYRIGHT_HOLDER
  const base = `© ${year} ${product}. ${FOOTER_RIGHTS_RESERVED}`
  if (options.includeTagline === false) return base
  return `${base} ${FOOTER_COPYRIGHT_TAGLINE}`
}

/** Compact copyright for inline or developer surfaces. */
export function formatCopyrightNoticeShort(options: CopyrightNoticeOptions = {}): string {
  const year = options.year ?? new Date().getFullYear()
  const product = options.product ?? COPYRIGHT_HOLDER
  return `© ${year} ${product}. ${FOOTER_RIGHTS_RESERVED}`
}

export const FOOTER_LEGAL_LINKS = [
  { href: 'https://espeezy.com/terms', label: 'Terms of Service' },
  { href: 'https://espeezy.com/privacy', label: 'Privacy Policy' },
  { href: 'https://espeezy.com/docs/refund-policy', label: 'Refund Policy' },
] as const
