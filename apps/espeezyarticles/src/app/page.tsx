
import { getArticles } from '../lib/articles'
import Link from 'next/link'
import ArticleCard from './ArticleCard'
import ArticlesPageHeader from '../components/ArticlesPageHeader'
import ArticlesPageFooter from '../components/ArticlesPageFooter'
import { ARTICLES_EMPTY_STATE, ARTICLES_PAGE_INTRO } from '@shared/app-ui-copy'

export default async function ArticlesPage() {
  const articles = await getArticles()

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <ArticlesPageHeader />
      <p style={{ color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.65 }}>{ARTICLES_PAGE_INTRO}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {articles?.length === 0 && <div style={{ color: '#64748b' }}>{ARTICLES_EMPTY_STATE}</div>}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <ArticlesPageFooter />
    </main>
  );
}
