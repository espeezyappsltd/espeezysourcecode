
import { getArticles } from '../lib/articles'
import Link from 'next/link'
import ArticleCard from './ArticleCard'
import ArticlesPageHeader from '../components/ArticlesPageHeader'

export default async function ArticlesPage() {
  const articles = await getArticles()

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <ArticlesPageHeader />
      <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>Latest articles, sorted by most recent. React, comment, and share your favorites!</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {articles?.length === 0 && <div>No articles found.</div>}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <Link href="/admin" style={{ color: '#6366f1', fontWeight: 700 }}>Go to Admin Panel</Link>
      </div>
    </main>
  );
}

