import './prestige.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <nav style={{ display: 'flex', gap: '1.5rem', padding: '1.2rem 2rem', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 50 }}>
          <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }}>🏠 Home</Link>
          <Link href="/docs" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }}>Docs</Link>
          <Link href="/kanban" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }}>Kanban</Link>
          <Link href="/games" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }}>Games</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
