/**
 * SUPABASE COMPATIBILITY SHIM
 * This file exists to satisfy build requirements during the Firebase migration.
 * Do not add new logic here. Migrate callers to use @/lib/firebase directly.
 */
export const createBrowserSupabaseClient = () => {
  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'auth') {
        return {
          updateUser: async () => ({ data: null, error: null }),
          signInWithPassword: async () => ({ data: null, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        };
      }
      return () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            order: () => ({ limit: async () => ({ data: [], error: null }) }),
          }),
          order: () => ({ limit: async () => ({ data: [], error: null }) }),
        }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null }),
      });
    }
  }) as any;
};
