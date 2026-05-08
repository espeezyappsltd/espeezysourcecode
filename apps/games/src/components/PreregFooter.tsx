'use client'

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
          flexWrap: 'wrap',
          gap: '1rem 1.5rem',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Espeezy Games. Learn through play.
        </p>
        <nav aria-label="Footer links" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/" style={linkStyle}>Home</a>
          <a href="/fund" style={linkStyle}>Support Us</a>
          <a href="/privacy" style={linkStyle}>Privacy</a>
          <a href="https://kanban.espeezy.com" style={linkStyle}>Kanban</a>
        </nav>
      </div>
    </footer>
  )
}
