const staff = [
  { name: 'Pete', role: 'Lead Dev' },
  { name: 'Pete', role: 'Designer' },
  { name: 'Pete', role: 'Product' },
  { name: 'EvryBady Digital', role: 'Marketing' },
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
