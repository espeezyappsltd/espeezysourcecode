import { supabase } from '../lib/supabase-client';

export async function getLatestArticles({ limit = 10, page = 1 } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  // Try to select tags, category, authorAvatar if present
  const { data, error, count } = await supabase
    .from('Article')
    .select('id, title, slug, content, author, authorAvatar, category, tags, createdAt', { count: 'exact' })
    .eq('published', true)
    .order('createdAt', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { articles: data, total: count };
}
