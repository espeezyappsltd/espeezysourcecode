'use client'

import Link from 'next/link'

export default function GamesLobbyClient() {
  return (
    <section style={{ display: 'grid', gap: '1rem', padding: '1.25rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Games Lobby</h1>
      <p style={{ margin: 0, color: 'var(--text-sub)' }}>
        Games are currently in lightweight local mode for refactor stability.
      </p>
      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 12, padding: '1.25rem 1.5rem', color: '#6ee7b7', fontWeight: 600, fontSize: '1.05rem', marginBottom: '1rem' }}>
        <span style={{ color: '#10b981', fontWeight: 800 }}>Account Tiers & Access</span><br />
        <ul style={{ margin: '0.5em 0 0 1.2em', padding: 0, color: '#6ee7b7', fontSize: '0.98em' }}>
          <li>Log in with a personal email for <strong>Free Tier</strong> access.</li>
          <li>Upgrade to <strong>Premium</strong> by verifying your school or institutional email.</li>
          <li>Roles: <strong>Personal</strong> (free), <strong>Student</strong> (premium), <strong>Educator</strong>, <strong>Admin</strong>.</li>
          <li>Premium features unlock automatically when your email is verified as belonging to a recognized institution.</li>
        </ul>
        <span style={{ color: '#10b981', fontWeight: 700 }}>You control your workspace, your data, and your team.</span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/games/puzzles" className="btn btn-primary">Open Puzzles</Link>
        <Link href="https://kanban.espeezy.com" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    </section>
  )
}
