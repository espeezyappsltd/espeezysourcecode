import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';

export default function AdminLobby() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      // Example: check admin role from user metadata or fetch from backend
      setIsAdmin(data.user?.role === 'admin' || data.user?.email?.endsWith('@espeezy.com'));
    });
  }, []);

  function sendGlobalNotification() {
    // Replace with actual backend call to send notification
    setNotification('Global notification sent to all admins!');
    setTimeout(() => setNotification(''), 3000);
  }

  if (!user) return <div>Loading...</div>;
  if (!isAdmin) return <div>Access denied. Admins only.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 12 }}>
      <h2>Admin Lobby</h2>
      <button onClick={sendGlobalNotification} style={{ marginBottom: 16 }}>Send Global Notification</button>
      {notification && <div style={{ color: 'green', marginBottom: 16 }}>{notification}</div>}
      <div>Welcome, {user.email}!</div>
      <div>One-click access to admin tools here.</div>
    </div>
  );
}
