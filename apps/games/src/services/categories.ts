import { supabase } from '@/lib/supabase-client';

export async function getCategoriesWithGames() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, games(id, name, url)')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addCategory(name: string) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, name: string) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function addGame(categoryId: string, name: string, url: string) {
  const { data, error } = await supabase
    .from('games')
    .insert([{ category_id: categoryId, name, url }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGame(id: string, name: string, url: string) {
  const { data, error } = await supabase
    .from('games')
    .update({ name, url })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGame(id: string) {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
