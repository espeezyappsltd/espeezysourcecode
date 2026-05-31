"use client";


import link from 'next/link';
import Link from 'next/link';
// Static list for browser compatibility; update as needed
const navlinks = [
  { name: 'Home', url: 'https://studio.espeezy.com/' },
  { name: 'Team', url: 'https://studio.espeezy.com/team' },
  { name: 'Analytics', url: 'https://studio.espeezy.com/analytics' },
  { name: 'Profile', url: 'https://studio.espeezy.com/profile' },
  { name: 'Jobs', url: 'https://studio.espeezy.com/jobs' },
  { name: 'Admin', url: 'https://studio.espeezy.com/admin-lobby' },
  // Add more apps here as needed
];

export default function AppsNav() {
  return (
    <nav className="apps-nav-pro" aria-label="Apps">

      <div style={{ padding: '0.5rem 1rem', backgroundColor: '#000', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="https://studio.espeezy.com/" style={{ fontWeight: 900, fontSize: '1.5rem', color: '#fff', textShadow: '0 1px 6px #6366f122' }}>
          App Galore
        </a>
      
      <ul style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
      }}>
        {navlinks.map(link => (
          <li key={link.name} style={{
            
          }}>
            <Link
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.5rem 1rem',
                color: '#fff',
                borderRadius: 4,
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'background 0.3s',

              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>


      </div>
    </nav>
  );
}
