import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _instance: SupabaseClient | null = null;

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder';

function isValidHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function getInstance(): SupabaseClient {
  if (!_instance) {
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const url = isValidHttpUrl(envUrl) ? envUrl : PLACEHOLDER_URL;
    const key = envKey && envKey !== 'your_supabase_anon_key' ? envKey : PLACEHOLDER_KEY;
    _instance = createBrowserClient(url, key);
  }
  return _instance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_: SupabaseClient, prop: string | symbol) {
    const client = getInstance();
    // Support both string and symbol keys for proxy
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
