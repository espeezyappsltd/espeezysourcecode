
import Link from 'next/link';
import type { Category, Game } from '@/types/games';

type CategoriesGamesSectionProps = {
  categories: Category[];
  loading?: boolean;
  error?: string | null;
};

export default function CategoriesGamesSection({ categories, loading, error }: CategoriesGamesSectionProps) {
  if (loading) return <div>Loading categories…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <section
      aria-labelledby="categories-heading"
      style={{
        padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 5vw, 2.5rem)',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <h2
        id="categories-heading"
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '2.5rem',
          color: '#0f172a',
        }}
      >
        Game Categories
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', justifyContent: 'center' }}>
        {categories.map((cat: Category) => (
          <div key={cat.id} style={{ background: 'linear-gradient(135deg, #f0fdf4 60%, #bbf7d0 100%)', border: '1.5px solid #059669', borderRadius: 18, padding: '2.2rem 1.2rem', boxShadow: '0 2px 12px 0 rgba(16,185,129,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <h3 style={{ color: '#059669', fontWeight: 900, fontSize: '1.3rem', margin: 0, textAlign: 'center', letterSpacing: '-0.01em' }}>
              <Link href={`/categories/${cat.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{cat.name}</Link>
            </h3>
            <div style={{ fontWeight: 400, fontSize: '1.05rem', color: '#0f172a', marginTop: 8, textAlign: 'center' }}>
              {cat.games?.length || 0} game{cat.games?.length === 1 ? '' : 's'}
            </div>
            {/* Games preview (first 2) */}
            {(cat.games && cat.games.length > 0) && (
              <div style={{ marginTop: 18, width: '100%' }}>
                <div style={{ fontWeight: 700, color: '#475569', fontSize: '1.01rem', marginBottom: 6 }}>Sample games:</div>
                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                  {(cat.games ?? []).slice(0, 2).map((game: Game) => (
                    <li key={game.id} style={{ marginBottom: 4, color: '#0f172a', fontWeight: 500, fontSize: '1.01rem' }}>
                      <Link href={`/games/${game.id}`} style={{ color: '#0f172a', textDecoration: 'underline' }}>{game.name}</Link>
                    </li>
                  ))}
                  {cat.games && cat.games.length > 2 && <li style={{ color: '#64748b', fontSize: '0.97rem' }}>+{cat.games.length - 2} more…</li>}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
