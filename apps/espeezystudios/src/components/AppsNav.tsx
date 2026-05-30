"use client";


import Link from 'next/link';
// Static list for browser compatibility; update as needed
const apps = [
  { name: 'Evybaby', url: 'https://evybaby.vercel.app' },
  { name: 'Savannah North', url: 'https://savannahnorth.vercel.app' },
  { name: 'PS Games', url: 'https://psgames.vercel.app' },
  // Add more apps here as needed
];

export default function AppsNav() {
  return (
    <nav className="apps-nav-pro" aria-label="Apps">
      <h3 style={{
        fontWeight: 800,
        fontSize: '1.1rem',
        letterSpacing: '-0.01em',
        margin: '1.5rem 0 0.5rem 0',
        color: '#0f172a',
        textTransform: 'uppercase',
        opacity: 0.8,
      }}>In Development</h3>
      <ul style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: 0,
        margin: 0,
        listStyle: 'none',
      }}>
        {apps.map(app => (
          <li key={app.name} style={{
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'box-shadow 0.2s',
            overflow: 'hidden',
          }}>
            <Link
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.7em',
                padding: '0.7em 1.1em',
                fontWeight: 600,
                color: '#0f172a',
                textDecoration: 'none',
                fontSize: '1rem',
                borderLeft: '4px solid #38bdf8',
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(8px)',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.12)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.5)')}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#38bdf8" strokeWidth="2"/><path d="M8 12l2.5 2.5L16 9" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {app.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
