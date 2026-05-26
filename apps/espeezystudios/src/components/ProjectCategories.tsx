const categories = [
  { name: 'Ongoing', color: '#4caf50', symbol: '🟢' },
  { name: 'Finished', color: '#2196f3', symbol: '🔵' },
  { name: '£££', color: '#ff9800', symbol: '💰' },
];

const projects = [
  { title: 'Kanban Board', status: 'Ongoing' },
  { title: 'Hustle Marketplace', status: 'Finished' },
  { title: 'Break Room', status: '£££' },
];

export default function ProjectCategories() {
  return (
    <section style={{ margin: '32px 0' }}>
      <h2>Project Categories</h2>
      <div style={{ display: 'flex', gap: 32 }}>
        {categories.map(cat => (
          <div key={cat.name} style={{ minWidth: 120 }}>
            <h3 style={{ color: cat.color }}>{cat.symbol} {cat.name}</h3>
            <ul>
              {projects.filter(p => p.status === cat.name).map(p => (
                <li key={p.title}>{p.title}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
