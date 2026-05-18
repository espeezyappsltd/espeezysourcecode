export default function SettingsLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-sub)' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          className="spinner"
          style={{
            border: '3px solid var(--border)',
            borderTop: '3px solid var(--brand)',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <span>Loading settings...</span>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
       `,
        }}
      />
    </div>
  )
}
