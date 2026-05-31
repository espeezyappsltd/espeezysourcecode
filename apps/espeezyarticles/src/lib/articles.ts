import { supabase } from './supabase-client'

/** Row shape from PostgREST (unquoted SQL columns are lowercase in Postgres). */
export type ArticleRow = {
  id: string
  title: string
  slug: string
  content: string
  author: string
  published: boolean
  metatitle?: string | null
  metadescription?: string | null
  metaimage?: string | null
  authoravatar?: string | null
  category?: string | null
  tags?: string[] | null
  createdat: string
  updatedat?: string
}

const ARTICLE_COLUMNS =
  'id, title, slug, content, author, published, metatitle, metadescription, metaimage, authoravatar, category, tags, createdat, updatedat'

/** Supabase table is `public.article` (lowercase), not `Article`. */
export async function getArticles(): Promise<ArticleRow[]> {
  const { data, error } = await supabase
    .from('article')
    .select(ARTICLE_COLUMNS)
    .eq('published', true)
    .order('createdat', { ascending: false })

  if (error) {
    console.error('[espeezyarticles] getArticles:', error.message, error.hint ?? '')
    return []
  }

  return (data ?? []) as ArticleRow[]
}
