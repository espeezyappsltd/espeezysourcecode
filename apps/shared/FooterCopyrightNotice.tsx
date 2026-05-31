'use client'

import { FOOTER_BOTTOM_RIGHT } from './platform-brand'
import {
  FOOTER_TRADEMARK_NOTICE,
  formatCopyrightNotice,
  type CopyrightNoticeOptions,
} from './platform-legal'

type Props = CopyrightNoticeOptions & {
  showTrademark?: boolean
  showBottomRight?: boolean
  primaryStyle?: React.CSSProperties
  secondaryStyle?: React.CSSProperties
  barStyle?: React.CSSProperties
}

const DEFAULT_BAR: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
}

const DEFAULT_PRIMARY: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#334155',
  margin: 0,
  lineHeight: 1.55,
}

const DEFAULT_SECONDARY: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#1e293b',
  margin: 0,
  fontWeight: 600,
}

export default function FooterCopyrightNotice({
  product,
  year,
  includeTagline,
  showTrademark = false,
  showBottomRight = true,
  primaryStyle,
  secondaryStyle,
  barStyle,
}: Props) {
  return (
    <div style={{ ...DEFAULT_BAR, ...barStyle }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 280px' }}>
        <p style={{ ...DEFAULT_PRIMARY, ...primaryStyle }}>
          {formatCopyrightNotice({ product, year, includeTagline })}
        </p>
        {showTrademark ? (
          <p style={{ ...DEFAULT_PRIMARY, fontSize: '0.72rem', color: '#475569', ...primaryStyle }}>
            {FOOTER_TRADEMARK_NOTICE}
          </p>
        ) : null}
      </div>
      {showBottomRight ? (
        <p style={{ ...DEFAULT_SECONDARY, ...secondaryStyle }}>{FOOTER_BOTTOM_RIGHT}</p>
      ) : null}
    </div>
  )
}
