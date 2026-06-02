'use client'

import { formatCopyrightNotice } from './platform-legal'

type Props = {
  product?: string
  className?: string
  style?: React.CSSProperties
}

/** Compact single-line © copyright for sidebars, modals, and help panels. */
export default function AppCopyrightStrip({ product, className, style }: Props) {
  return (
    <p
      className={className}
      style={{
        margin: 0,
        fontSize: '0.72rem',
        lineHeight: 1.5,
        color: 'inherit',
        opacity: 0.75,
        ...style,
      }}
      suppressHydrationWarning
    >
      {formatCopyrightNotice({ product })}
    </p>
  )
}
