import { getArticles } from '../lib/articles'
import ArticleCard from './ArticleCard'
import ArticlesPageHeader from '../components/ArticlesPageHeader'
import { ARTICLES_EMPTY_STATE } from '@shared/app-ui-copy'

export default async function ArticlesPage() {
  const articles = await getArticles()

  return (
    <div className="articles-page">
      <ArticlesPageHeader />
      <section className="articles-list" aria-label="Published articles">
        {articles.length === 0 ? (
          <p className="articles-empty">{ARTICLES_EMPTY_STATE}</p>
        ) : (
          articles.map((article) => <ArticleCard key={article.id} article={article} />)
        )}
      </section>
    </div>
  )
}
