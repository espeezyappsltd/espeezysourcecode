import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppsNav from './AppsNav';

const menu = [
  { name: 'Home', path: '/' },
  { name: 'Gallery', path: '/#gallery' },
  { name: 'Projects', path: '/#projects' },
  { name: 'Staff Lobby', path: '/#staff' },
  { name: 'Jobs', path: '/jobs' },
  { name: 'Login', path: '/login' },
  { name: 'Admin Lobby', path: '/admin-lobby' },
];

export default function Sidebar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <header className="sidebar">
      <div className="sidebar__bar">
        <span className="sidebar__brand">Espeezy Studios</span>
        <button
          type="button"
          className="sidebar__toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen(prev => !prev)}
        >
          <span aria-hidden="true">{open ? '\u2715' : '\u2630'}</span>
          {open ? 'Close menu' : 'Menu'}
        </button>
      </div>
      <nav
        id="primary-navigation"
        className="sidebar__nav"
        aria-label="Primary"
        style={{ display: open ? 'block' : 'none' }}
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
  );
}
