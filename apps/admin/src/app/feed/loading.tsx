export default function Loading() {
  return (
    <div
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            animation: 'skeleton-pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ height: '12px', width: '40%', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ height: '10px', width: '25%', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
          <div style={{ height: '14px', width: '90%', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ height: '14px', width: '70%', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }} />
        </div>
      ))}
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
