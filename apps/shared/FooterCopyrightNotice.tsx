'use client'

import { formatCopyrightNotice, type CopyrightNoticeOptions } from './platform-legal'

type Props = CopyrightNoticeOptions & {
  className?: string
  style?: React.CSSProperties
}

/** Full-width single-line footer copyright with © symbol. */
export default function FooterCopyrightNotice({ product, year, className, style }: Props) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        textAlign: 'center',
        padding: '1rem 0',
        color: '#64748b',
        ...style,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '0.78rem',
          lineHeight: 1.5,
          color: 'inherit',
          letterSpacing: '0.01em',
        }}
        suppressHydrationWarning
      >
        {formatCopyrightNotice({ product, year })}
      </p>
    </div>
  )
}
