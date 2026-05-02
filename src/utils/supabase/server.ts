/**
 * SUPABASE COMPATIBILITY SHIM (SERVER)
 * Satisfies build requirements during Firebase migration.
 */
export const createServerSupabaseClient = async () => {
  return new Proxy({}, {
    get: () => () => ({ data: null, error: null })
  }) as any;
};

export const createAdminClient = async () => {
  return new Proxy({}, {
    get: () => () => ({ data: null, error: null, single: async () => ({ data: null, error: null }) })
  }) as any;
};

export const createReadClient = () => {
  return new Proxy({}, {
    get: () => () => ({ data: null, error: null, single: async () => ({ data: null, error: null }) })
  }) as any;
};
