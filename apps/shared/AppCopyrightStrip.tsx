'use client'

import { formatCopyrightNoticeShort } from './platform-legal'

type Props = {
  /** Legal product name (default: Espeezy) */
  product?: string
  className?: string
  style?: React.CSSProperties
  /** Include educative tagline below the copyright line */
  showTagline?: boolean
}

const TAGLINE =
  'Collaboration and learning software for university teams, educators, and organizations worldwide.'

export default function AppCopyrightStrip({
  product,
  className,
  style,
  showTagline = false,
}: Props) {
  return (
    <div
      className={className}
      style={{
        fontSize: '0.72rem',
        lineHeight: 1.55,
        color: 'inherit',
        opacity: 0.75,
        ...style,
      }}
    >
      <p style={{ margin: 0 }} suppressHydrationWarning>
        {formatCopyrightNoticeShort({ product })}
      </p>
      {showTagline ? (
        <p style={{ margin: '0.35rem 0 0', maxWidth: '36rem' }}>{TAGLINE}</p>
      ) : null}
    </div>
  )
}
