const staff = [
  { name: 'Alice', role: 'Lead Dev' },
  { name: 'Bob', role: 'Designer' },
  { name: 'Eve', role: 'Product' },
];

export default function StaffLobby() {
  return (
    <section style={{ margin: '32px 0' }}>
      <h2>Staff Lobby</h2>
      <ul style={{ display: 'flex', gap: 32 }}>
        {staff.map(member => (
          <li key={member.name} style={{ minWidth: 120 }}>
            <div style={{ fontWeight: 'bold' }}>{member.name}</div>
            <div>{member.role}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
