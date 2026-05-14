export default function Loading() {
  return (
    <div
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Page header */}
      <div
        style={{
          height: '48px',
          width: '260px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.05)',
          animation: 'skeleton-pulse 1.4s ease-in-out infinite',
        }}
      />
      {/* Chart cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '220px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'skeleton-pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
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
