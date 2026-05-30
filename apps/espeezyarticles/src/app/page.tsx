
import { getArticles, getArticleReactions } from '../lib/articles';
import Link from 'next/link';

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

async function ArticleCard({ article }) {
  // Placeholder for reactions
  // const reactions = await getArticleReactions(article.id)
  return (
    <article style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(15,23,42,0.07)', padding: '2rem', border: '1px solid #f1f5f9' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{article.title}</h2>
      <div style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.2rem' }}>
        By {article.author} &middot; {new Date(article.createdAt).toLocaleDateString()}
      </div>
      <div style={{ color: '#334155', fontSize: '1.08rem', marginBottom: '1.5rem' }}>
        {article.content.slice(0, 320)}{article.content.length > 320 ? '...' : ''}
      </div>
      {/* Reactions placeholder */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '1rem' }}>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>★</span>
        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>👍</span>
        <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '1.1rem' }}>💬</span>
        <span style={{ color: '#64748b', fontSize: '0.95rem', marginLeft: '0.5rem' }}>Active reactions coming soon</span>
      </div>
    </article>
  );
}
