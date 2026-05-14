import Image from 'next/image'

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      style={{
        minHeight: '100vh',
        background: '#ffffff',
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
        border: '3px solid rgba(99,102,241,0.15)',
        borderTopColor: '#6366f1',
        animation: 'spin 0.75s linear infinite',
      }} />

      {/* Brand logo + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.6 }}>
        <div style={{
          width: '24px',
          height: '24px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Image src="/brand_logo2.svg" width={16} height={16} style={{ objectFit: 'contain' }} alt="" priority />
        </div>
        <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'rgba(15,23,42,0.5)', letterSpacing: '-0.02em' }}>
          Espeezy
        </span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
