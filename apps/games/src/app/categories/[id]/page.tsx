
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGamesByCategoryPaginated } from '@/hooks/useGamesByCategoryPaginated';
import type { Game } from '@/types/games';

export default function CategoryGamesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { games, count, loading, error } = useGamesByCategoryPaginated(id as string, page, pageSize);
  const totalPages = Math.ceil((count || 0) / pageSize);

  if (loading) return <div>Loading games…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <section style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1rem' }} aria-labelledby="games-heading">
      <button 
        onClick={() => router.push('/categories')}
        style={{ marginBottom: 24, background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
        aria-label="Back to Categories"
      >
        ← Back to Categories
      </button>
      <h1 id="games-heading" style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: 18 }}>Games</h1>
      {games.length ? (
        <ul 
          style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 }}
          aria-label="Games list"
        >
          {games.map((game: Game) => (
            <li key={game.id}>
              <button
                onClick={() => router.push(`/games/${game.id}`)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: '#fff',
                  borderBottom: '1px solid #e5e7eb',
                  padding: '1.1rem 1.2rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#0f172a',
                  fontSize: '1.1rem',
                }}
                aria-label={`View details for ${game.name}`}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push(`/games/${game.id}`);
                  }
                }}
              >
                {game.name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ color: '#64748b', fontSize: '1.1rem', marginTop: 30 }}>No games in this category yet.</div>
      )}
      <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{ padding: '0.5rem 1.2rem', borderRadius: 7, border: '1px solid #059669', background: page === 1 ? '#e5e7eb' : '#fff', color: '#059669', fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          aria-label="Previous page"
        >
          Prev
        </button>
        <span style={{ fontWeight: 700, color: '#0f172a', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          style={{ padding: '0.5rem 1.2rem', borderRadius: 7, border: '1px solid #059669', background: page === totalPages ? '#e5e7eb' : '#fff', color: '#059669', fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    </section>
  );
}
