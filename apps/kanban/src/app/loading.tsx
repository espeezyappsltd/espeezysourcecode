export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #0a0a0a)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        gap: '1.5rem',
      }}
    >
      {/* Sidebar skeleton */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        <div
          style={{
            width: '240px',
            flexShrink: 0,
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)',
            animation: 'skeleton-pulse 1.4s ease-in-out infinite',
          }}
        />

        {/* Main content skeleton */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header bar */}
          <div
            style={{
              height: '56px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              animation: 'skeleton-pulse 1.4s ease-in-out infinite',
            }}
          />

          {/* Kanban columns */}
          <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  minHeight: '400px',
                  animationDelay: `${i * 0.1}s`,
                  animation: 'skeleton-pulse 1.4s ease-in-out infinite',
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    height: '40px',
                    margin: '1rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                />
                {/* Cards */}
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    style={{
                      height: '80px',
                      margin: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
