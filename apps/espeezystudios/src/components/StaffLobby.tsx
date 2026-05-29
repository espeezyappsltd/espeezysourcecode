const staff = [
  { name: 'Alice', role: 'Lead Dev' },
  { name: 'Bob', role: 'Designer' },
  { name: 'Eve', role: 'Product' },
];

export default function StaffLobby() {
  return (
    <section id="staff" className="section" aria-labelledby="staff-heading">
      <h2 id="staff-heading">Staff Lobby</h2>
      <ul className="card-grid">
        {staff.map(member => (
          <li key={member.name}>
            <span className="staff__name">{member.name}</span>
            <span className="staff__role"> — {member.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
