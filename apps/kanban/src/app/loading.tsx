export default function DashboardLoading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="spinner" />
      <p style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600, margin: 0 }}>Loading your workspace…</p>
    </div>
  )
}
