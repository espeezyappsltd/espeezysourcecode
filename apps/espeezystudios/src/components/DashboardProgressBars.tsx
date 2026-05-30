

const progressData = [
  { label: 'Jobs Progress', value: 70, color: '#6366f1' },
  { label: 'Projects Complete', value: 40, color: '#22c55e' },
  { label: 'Team Onboarded', value: 90, color: '#10b981' },
];

export default function DashboardProgressBars() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.2rem',
      margin: '0 0 2.5rem 0',
      width: '100%',
      maxWidth: 900,
    }}>
      {progressData.map((p) => (
        <div key={p.label} style={{
          background: 'var(--studios-surface-2)',
          borderRadius: 14,
          padding: '1.1rem 1.2rem',
          boxShadow: '0 1px 8px rgba(15,23,42,0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--studios-muted)' }}>{p.label}</div>
          <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <div
              style={{
                width: `${p.value}%`,
                height: '100%',
                background: p.color,
                borderRadius: 6,
                transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
              }}
            />
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', color: p.color }}>{p.value}%</div>
        </div>
      ))}
    </div>
  );
}
