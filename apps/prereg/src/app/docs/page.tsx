import Link from 'next/link'
import { BookOpen, Zap, Shield, Sparkles, Globe, BarChart, ShoppingBag } from 'lucide-react'

export default function DocsHomePage() {
  const sections = [
    { icon: <Zap size={20} />, title: 'Getting Started', desc: 'Set up your workspace and invite your team in minutes.', href: '/docs/getting-started' },
    { icon: <BookOpen size={20} />, title: 'Kanban Boards', desc: 'Visualize every task in your group project lifecycle.', href: '/docs/features/kanban' },
    { icon: <Globe size={20} />, title: 'Peer Network', desc: 'Find collaborators and share resources across your institution.', href: '/docs/features/network' },
    { icon: <Shield size={20} />, title: 'Infrastructure', desc: 'Stripe, Supabase sync, and real-time presence architecture.', href: '/docs/infra/payments' },
    { icon: <BarChart size={20} />, title: 'Impact & Research', desc: 'The research on why visible contribution improves group work.', href: '/docs/impact' },
    { icon: <ShoppingBag size={20} />, title: 'Side Hustle', desc: 'A managed task marketplace for academic and creative side work.', href: '/docs/features/hustle' },
    { icon: <Sparkles size={20} />, title: 'Our Vision', desc: 'Why we built Espeezy and where it is headed.', href: '/docs/vision' },
  ]

  return (
    <div className="docs-content">
      <div className="docs-hero">
        <span className="docs-badge">Espeezy Docs</span>
        <h1 className="docs-title">Documentation</h1>
        <p className="docs-description">
          Everything you need to set up, use, and self-host Espeezy — for technical teams
          and for students who just want to get started.
        </p>
      </div>

      <div className="docs-section">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#f3f4f6' }}>Quick Navigation</h2>
        <div className="docs-grid">
          {sections.map((s, i) => (
            <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>
              <div className="docs-card">
                <div style={{ color: '#10b981', marginBottom: '0.75rem', opacity: 0.8 }}>{s.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.4rem', color: '#f3f4f6', fontSize: '0.95rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="docs-actions">
        <Link href="/docs/getting-started" style={{ padding: '0.875rem 2rem', borderRadius: '10px', background: '#10b981', color: 'white', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
          Start Here →
        </Link>
        <Link href="/docs/features/kanban" style={{ padding: '0.875rem 2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
          Explore Features
        </Link>
      </div>
    </div>
  )
}
