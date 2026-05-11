export default function AdminPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Espeezy Admin Dashboard</h1>
      <p>Welcome to the administrative control center.</p>
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h3>Users</h3>
          <p>Manage user accounts and permissions.</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h3>Settings</h3>
          <p>Configure system-wide parameters.</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h3>Analytics</h3>
          <p>View platform usage and growth.</p>
        </div>
      </div>
    </div>
  );
}
