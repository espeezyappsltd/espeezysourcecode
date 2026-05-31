import { supabase } from './supabase-client';

export type ArticleSummary = {
  id: string
  title: string
  slug: string
  content: string
  author: string
  authorAvatar?: string | null
  category?: string | null
  tags?: string[] | null
  createdAt: string
  metaTitle?: string | null
  metaDescription?: string | null
  metaImage?: string | null
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
    .from('Article')
    .select(
      'id, title, slug, content, author, authorAvatar, category, tags, createdAt, metaTitle, metaDescription, metaImage',
      { count: 'exact' },
    )
    .eq('published', true)
    .order('createdAt', { ascending: false })
    .range(from, to)
  if (error) throw error
  return { articles: (data ?? []) as ArticleSummary[], total: count }
}
