export default function CoreHomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <section className="page-shell" style={{ width: '100%' }}>
        <div
          className="panel-card flow-stack"
          style={{
            width: 'min(var(--content-narrow), 100%)',
            margin: '0 auto',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div className="flow-tight">
            <p className="eyebrow">Espeezy Core App</p>
            <h1 className="title-display">Local VM runtime for the scaled main app</h1>
            <p className="body-copy">
              This is the 4th app target under apps/. It is intended to run locally in Docker on a smaller VM,
              while prereg, games, and kanban remain isolated app surfaces.
            </p>
          </div>

          <div
            className="flow-tight"
            style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)', color: '#d1d5db' }}
          >
            <div>Container profile: local core runtime</div>
            <div>App path: apps/core</div>
            <div>Port: 3000 (mapped to host 3000)</div>
          </div>
        </div>
      </section>
    </main>
  )
}
