const staff = [
  { name: 'Alice', role: 'Lead Dev' },
  { name: 'Bob', role: 'Designer' },
  { name: 'Eve', role: 'Product' },
];

export default function StaffLobby() {
  return (
    <section id="staff" className="section staff-lobby" aria-labelledby="staff-heading">
      <h2 id="staff-heading">Active Team</h2>
      <ul className="card-grid">
        {staff.map(member => (
          <li key={member.name} className="card staff-card">
            <span className="staff__name">{member.name}</span>
            <span className="staff__role"> : {member.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
