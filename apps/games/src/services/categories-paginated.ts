import { getSupabase } from '@/lib/supabase-client';

const supabase = () => getSupabase();

export async function getCategoriesPaginated(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase()
    .from('categories')
    .select('id, name', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);
  if (error) throw error;
  return { data, count };
}

export async function getGamesByCategoryPaginated(categoryId: string, page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase()
    .from('games')
    .select('id, name, url', { count: 'exact' })
    .eq('category_id', categoryId)
    .order('name', { ascending: true })
    .range(from, to);
  if (error) throw error;
  return { data, count };
}
