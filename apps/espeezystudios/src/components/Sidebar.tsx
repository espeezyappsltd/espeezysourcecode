import Link from 'next/link';
import { useRouter } from 'next/router';

const menu = [
  { name: 'Home', path: '/' },
  { name: 'Gallery', path: '/#gallery' },
  { name: 'Projects', path: '/#projects' },
  { name: 'Staff Lobby', path: '/#staff' },
  { name: 'Login', path: '/login' },
  { name: 'Admin Lobby', path: '/admin-lobby' },
];

export default function Sidebar() {
  const router = useRouter();
  return (
    <aside style={{ width: 220, padding: 24, background: '#f5f5f5', height: '100vh', position: 'fixed' }}>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {menu.map(item => (
            <li key={item.name} style={{ margin: '18px 0' }}>
              <Link href={item.path} legacyBehavior>
                <a style={{ color: router.pathname === item.path ? '#1976d2' : '#222', fontWeight: router.pathname === item.path ? 700 : 400 }}>{item.name}</a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
