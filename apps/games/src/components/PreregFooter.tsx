'use client'

import {
  APP_FOOTER_TAGLINE_GAMES,
  FOOTER_IMPORTANT_INFO,
} from '@/lib/platform/brand-copy'
import FooterCopyrightNotice from '@shared/FooterCopyrightNotice'

export default function PreregFooter() {
  const linkStyle: React.CSSProperties = {
    color: '#94a3b8',
    textDecoration: 'none',
  }

  return (
    <footer
      aria-label="Site footer"
      style={{
        marginTop: '4rem',
        background: '#0f172a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        color: '#94a3b8',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem 1.5rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{APP_FOOTER_TAGLINE_GAMES}</p>
          <nav aria-label="Footer links" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="https://espeezy.com" style={linkStyle}>Home</a>
            <a href="https://espeezy.com/#register" style={linkStyle}>Early access</a>
            <a href="https://espeezy.com/pricing" style={linkStyle}>Plans and pricing</a>
            <a href="https://espeezy.com/privacy" style={linkStyle}>Privacy</a>
            <a href="https://espeezy.com/docs" target="_blank" rel="noopener noreferrer" style={linkStyle}>Documentation</a>
            <a href="https://kanban.espeezy.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>Kanban</a>
          </nav>
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.55, color: '#64748b', maxWidth: '640px', whiteSpace: 'pre-line' }}>
          {FOOTER_IMPORTANT_INFO}
        </p>
        <FooterCopyrightNotice showBottomRight={false} />
      </div>
    </footer>
  )
}
