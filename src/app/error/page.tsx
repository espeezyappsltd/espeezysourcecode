export default function ErrorPage() {
  return (
    <div className="dashboard-layout">
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Something went wrong</h1>
        <p style={{ color: 'var(--text-secondary)' }}>There was an error with your authentication request.</p>
      </main>
    </div>
  )
}
