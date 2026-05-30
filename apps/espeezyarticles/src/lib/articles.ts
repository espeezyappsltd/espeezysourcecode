import { supabase } from '../lib/supabase-client';

export async function getArticles() {
  const { data, error } = await supabase
    .from('Article')
    .select('*')
    .eq('published', true)
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getArticleReactions(articleId: string) {
  // Placeholder: implement if reactions table exists
  return [];
}
