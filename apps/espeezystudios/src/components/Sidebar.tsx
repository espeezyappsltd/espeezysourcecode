
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppsNav from './AppsNav';

const menu = [
  { name: 'Home', path: '/' },
  { name: 'Gallery', path: '/#gallery' },
  { name: 'Projects', path: '/#projects' },
  { name: 'Staff Lobby', path: '/#staff' },
  { name: 'Jobs', path: '/jobs' },
  { name: 'Profile', path: '/profile' },
  { name: 'Login', path: '/login' },
  { name: 'Admin Lobby', path: '/admin-lobby' },
];

export default function Sidebar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Propagate theme to <html> and <body>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Prevent scroll when sidebar is open (mobile)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Sidebar width for animation
  const SIDEBAR_WIDTH = 270;

  // Track if screen is desktop (client only)
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {open && !isDesktop && (
        <div
          className="sidebar-overlay"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}
      <header
        className="sidebar highend-sidebar"
        style={{
          transform: open || isDesktop ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH}px)`,
          boxShadow: open && !isDesktop ? '0 0 0 9999px rgba(0,0,0,0.32)' : 'none',
          transition: 'transform 0.35s cubic-bezier(.77,0,.18,1), box-shadow 0.25s',
          zIndex: 1002,
        }}
        aria-label="Sidebar navigation"
      >
        <div className="sidebar__bar">
          <span className="sidebar__brand">Espeezy Studios</span>
          <button
            type="button"
            className="sidebar__toggle"
            aria-expanded={open}
            aria-controls="primary-navigation"
            onClick={() => setOpen(prev => !prev)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span aria-hidden="true" style={{ fontSize: 22, marginRight: 6 }}>{open ? '✖' : '☰'}</span>
            <span style={{ fontWeight: 600 }}>{open ? 'Close' : 'Menu'}</span>
          </button>
          <button
            type="button"
            aria-label="Toggle theme"
            className="sidebar-theme-toggle"
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
        <nav
          id="primary-navigation"
          className="sidebar__nav"
          aria-label="Primary"
          style={{ display: open || isDesktop ? 'block' : 'none' }}
        >
          <ul className="sidebar__list">
            {menu.map(item => {
              const isCurrent = router.asPath === item.path;
              return (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    className="sidebar__link"
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <AppsNav />
        </nav>
      </header>
    </>
  );
}
