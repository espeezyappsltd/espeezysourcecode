import type { ElementType, ReactNode } from 'react'

export type PageShellVariant = 'default' | 'narrow' | 'wide' | 'full'

const VARIANT_CLASS: Record<PageShellVariant, string> = {
  default: '',
  narrow: 'page-shell--narrow',
  wide: 'page-shell--wide',
  full: 'page-shell--full',
}

type PageShellProps = {
  children: ReactNode
  variant?: PageShellVariant
  className?: string
  as?: ElementType
}

/** Standard page width wrapper — use inside dashboard `main-content`. */
export function PageShell({
  children,
  variant = 'default',
  className = '',
  as: Tag = 'div',
}: PageShellProps) {
  const variantClass = VARIANT_CLASS[variant]
  const classes = ['page-shell', 'page-fade', variantClass, className].filter(Boolean).join(' ')
  return <Tag className={classes}>{children}</Tag>
}
