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

export async function getArticleReactions(articleId) {
  const { data, error } = await supabase
    .from('Reaction')
    .select('type, userId')
    .eq('articleId', articleId);
  if (error) throw error;
  return data;
}

export async function addReaction(articleId, userId, type) {
  const { data, error } = await supabase
    .from('Reaction')
    .insert([{ articleId, userId, type }]);
  if (error) throw error;
  return data;
}
