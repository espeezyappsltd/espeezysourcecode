import { supabase } from './supabase-client';

export type ArticleSummary = {
  id: string
  title: string
  slug: string
  content: string
  author: string
  authoravatar?: string | null
  category?: string | null
  tags?: string[] | null
  createdat: string
  metatitle?: string | null
  metadescription?: string | null
  metaimage?: string | null
}

export async function getLatestArticles({
  limit = 10,
  page = 1,
}: {
  limit?: number
  page?: number
} = {}): Promise<{ articles: ArticleSummary[]; total: number | null }> {
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
  if (error) throw error
  return { articles: (data ?? []) as ArticleSummary[], total: count }
}
