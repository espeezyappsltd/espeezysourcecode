const categories = [
  { name: 'Ongoing', color: '#2e7d32', symbol: '🟢' },
  { name: 'Finished', color: '#1565c0', symbol: '🔵' },
  { name: '£££', color: '#b45309', symbol: '💰' },
];

const projects = [
  { title: 'Kanban Board', status: 'Ongoing' },
  { title: 'Hustle Marketplace', status: 'Finished' },
  { title: 'Break Room', status: '£££' },
];

export default function ProjectCategories() {
  return (
    <section id="projects" className="section" aria-labelledby="projects-heading">
      <h2 id="projects-heading">Project Categories</h2>
      <div className="card-grid">
        {categories.map(cat => (
          <div key={cat.name}>
            <h3 className="category__heading" style={{ color: cat.color }}>
              <span aria-hidden="true">{cat.symbol} </span>
              {cat.name}
            </h3>
            <ul className="category__list">
              {projects
                .filter(p => p.status === cat.name)
                .map(p => (
                  <li key={p.title}>{p.title}</li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
