import { supabase } from './supabase-client'
import type { ArticleRow } from './articles'

export async function getLatestArticles({ limit = 10, page = 1 } = {}) {
  const from = (page - 1) * limit
  const to = from + limit - 1
  const { data, error, count } = await supabase
    .from('article')
    .select(
      'id, title, slug, content, author, authoravatar, category, tags, createdat, metatitle, metadescription, metaimage',
      { count: 'exact' },
    )
    .eq('published', true)
    .order('createdat', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[espeezyarticles] getLatestArticles:', error.message)
    return { articles: [] as ArticleRow[], total: 0 }
  }

  return { articles: (data ?? []) as ArticleRow[], total: count ?? 0 }
}
