

import { getArticles } from '../lib/articles';
import { getArticleReactions, addReaction } from '../lib/reactions';
import Link from 'next/link';
import { useState } from 'react';

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontWeight: 900, fontSize: '2.5rem', marginBottom: '1.5rem' }}>Espeezy Articles</h1>
      <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>Latest articles, sorted by most recent. React, comment, and share your favorites!</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {articles?.length === 0 && <div>No articles found.</div>}
        {articles?.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <Link href="/admin" style={{ color: '#6366f1', fontWeight: 700 }}>Go to Admin Panel</Link>
      </div>
    </main>
  );
}

function ArticleCard({ article }) {
  const [reactions, setReactions] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchReactions() {
    setLoading(true);
    const data = await getArticleReactions(article.id);
    setReactions(data);
    setLoading(false);
  }

  async function handleReact(type) {
    // Replace with real userId from auth
    const userId = 'demo-user';
    await addReaction(article.id, userId, type);
    fetchReactions();
  }

  // Fetch reactions on mount
  useState(() => { fetchReactions(); }, []);

  const count = (type) => reactions?.filter(r => r.type === type).length || 0;

  return (
    <article style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(15,23,42,0.07)', padding: '2rem', border: '1px solid #f1f5f9' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{article.title}</h2>
      <div style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.2rem' }}>
        By {article.author} &middot; {new Date(article.createdAt).toLocaleDateString()}
      </div>
      <div style={{ color: '#334155', fontSize: '1.08rem', marginBottom: '1.5rem' }}>
        {article.content.slice(0, 320)}{article.content.length > 320 ? '...' : ''}
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '1rem' }}>
        <button onClick={() => handleReact('star')} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>★ {count('star')}</button>
        <button onClick={() => handleReact('like')} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>👍 {count('like')}</button>
        <button onClick={() => handleReact('comment')} disabled style={{ background: 'none', border: 'none', cursor: 'not-allowed', color: '#6366f1', fontWeight: 700, fontSize: '1.1rem' }}>💬 {count('comment')}</button>
        <span style={{ color: '#64748b', fontSize: '0.95rem', marginLeft: '0.5rem' }}>{loading ? 'Loading...' : 'React to this article!'}</span>
      </div>
    </article>
  );
}
