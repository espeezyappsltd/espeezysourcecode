/**
 * Copyright and legal notices — single source of truth for all Espeezy apps.
 */

export const COPYRIGHT_HOLDER = 'Espeezy'

export const COPYRIGHT_STUDIOS_PRODUCT = 'Espeezy Studios'

export const FOOTER_RIGHTS_RESERVED = 'All rights reserved.'

/** @deprecated Tagline removed from footer UI — use docs/marketing copy instead. */
export const FOOTER_COPYRIGHT_TAGLINE =
  'Collaboration and learning software for university teams, educators, and organizations worldwide.'

/** @deprecated Trademark line removed from footer UI. */
export const FOOTER_TRADEMARK_NOTICE =
  'Espeezy names, logos, and product marks are trademarks of Espeezy. Unauthorized use is prohibited.'

export type CopyrightNoticeOptions = {
  product?: string
  year?: number
}

/** Single-line copyright for all footers: © {year} {product}. All rights reserved. */
export function formatCopyrightNotice(options: CopyrightNoticeOptions = {}): string {
  const year = options.year ?? new Date().getFullYear()
  const product = options.product ?? COPYRIGHT_HOLDER
  return `© ${year} ${product}. ${FOOTER_RIGHTS_RESERVED}`
}

/** @deprecated Use formatCopyrightNotice — same output. */
export function formatCopyrightNoticeShort(options: CopyrightNoticeOptions = {}): string {
  return formatCopyrightNotice(options)
}

export const FOOTER_LEGAL_LINKS = [
  { href: 'https://espeezy.com/terms', label: 'Terms of Service' },
  { href: 'https://espeezy.com/privacy', label: 'Privacy Policy' },
  { href: 'https://espeezy.com/docs/refund-policy', label: 'Refund Policy' },
] as const
