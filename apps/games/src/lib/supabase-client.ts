import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseEnv } from './supabase-env'

const { url, anonKey } = resolveSupabaseEnv();
if (!url || !anonKey) {
  throw new Error('Supabase configuration missing: url or anonKey not set');
}

export const supabase: SupabaseClient = createClient(url, anonKey);
