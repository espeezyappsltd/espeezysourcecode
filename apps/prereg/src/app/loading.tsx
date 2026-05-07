export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1.25rem',
    }}>
      {/* Spinning ring */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid rgba(16,185,129,0.15)',
        borderTopColor: '#10b981',
        animation: 'spin 0.75s linear infinite',
      }} />

      {/* Brand logo + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.6 }}>
        <div style={{
          width: '24px',
          height: '24px',
          background: '#10b981',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img src="/brand_logo2.svg" style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="" />
        </div>
        <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.02em' }}>
          Espeezy
        </span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
