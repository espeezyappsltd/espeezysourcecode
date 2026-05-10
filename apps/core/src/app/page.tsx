export default function CoreHomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <section
        style={{
          width: 'min(920px, 100%)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          padding: '2rem',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--brand)',
            fontWeight: 800,
          }}
        >
          Espeezy Core App
        </p>
        <h1 style={{ margin: '0.6rem 0 0', fontSize: '2rem', lineHeight: 1.15 }}>
          Local VM runtime for the scaled main app
        </h1>
        <p style={{ margin: '0.85rem 0 0', color: 'var(--muted)', lineHeight: 1.6 }}>
          This is the 4th app target under apps/. It is intended to run locally in Docker on a smaller VM,
          while prereg, games, and kanban remain isolated app surfaces.
        </p>

        <div
          style={{
            marginTop: '1.25rem',
            borderTop: '1px solid var(--border)',
            paddingTop: '1rem',
            display: 'grid',
            gap: '0.4rem',
            color: '#d1d5db',
          }}
        >
          <div>Container profile: local core runtime</div>
          <div>App path: apps/core</div>
          <div>Port: 3000 (mapped to host 3000)</div>
        </div>
      </section>
    </main>
  )
}
