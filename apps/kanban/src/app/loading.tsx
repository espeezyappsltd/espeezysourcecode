export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: '#0a0a0a',
        color: 'rgba(255,255,255,0.45)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          border: '2px solid rgba(16, 185, 129, 0.15)',
          borderTopColor: '#10b981',
          animation: 'kanban-root-spin 0.75s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loading workspace…</span>
      <style>{`@keyframes kanban-root-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
