'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCategoriesPaginated } from '@/hooks/useCategoriesPaginated';

export default function CategoriesList() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { categories, count, loading, error } = useCategoriesPaginated(page, pageSize);
  const router = useRouter();

  if (loading) return <div>Loading categories…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <section style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, textAlign: 'center', marginBottom: 40, color: '#0f172a' }}>
        Game Categories
      </h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 }}>
        {categories.map((cat) => (
          <li key={cat.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '1.1rem 1.2rem', cursor: 'pointer', fontWeight: 700, color: '#0f172a', fontSize: '1.1rem', background: '#fff' }}
              onClick={() => router.push(`/categories/${cat.id}`)}
          >
            {cat.name}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.5rem 1.2rem', borderRadius: 7, border: '1px solid #059669', background: page === 1 ? '#e5e7eb' : '#fff', color: '#059669', fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
        <span style={{ fontWeight: 700, color: '#0f172a', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '0.5rem 1.2rem', borderRadius: 7, border: '1px solid #059669', background: page === totalPages ? '#e5e7eb' : '#fff', color: '#059669', fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
      </div>
    </section>
  );
}
