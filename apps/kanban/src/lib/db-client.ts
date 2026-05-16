import { createClient as createBrowserSupabaseClient } from './supabase/client'
export { createBrowserSupabaseClient }

// Export a real Supabase client only. No shims.
export const db = createBrowserSupabaseClient()

// --- AUTH ---
export const auth = {
  get currentUser() {
    // Note: This is synchronous in Firebase but asynchronous in Supabase.
    // For now, we return a partial user from the current session if available.
    return (db as { _session?: { user?: { id?: string; email?: string } } })._session?.user || null
  },
  signOut: () => db.auth.signOut(),
  onAuthStateChanged: (cb: (user: { id?: string; email?: string } | null) => void) => {
    const { data } = db.auth.onAuthStateChange((_event, session) => {
      // Store session for the synchronous currentUser getter
      ;(db as { _session?: { user?: { id?: string; email?: string } } | null })._session = session
      cb(session?.user || null)
    })
    // Trigger immediate callback if session exists
    db.auth.getSession().then(({ data: { session } }) => {
      ;(db as { _session?: { user?: { id?: string; email?: string } } | null })._session = session
      cb(session?.user || null)
    })
    return { subscription: { unsubscribe: () => data.subscription.unsubscribe() } }
  },
}

export const onAuthStateChanged = auth.onAuthStateChanged;

// --- STORAGE ---
export const storage = db.storage
export const ref = (_storage: unknown, path: string) => path
export const uploadBytes = async (path: string, file: File | Blob | ArrayBuffer) => {
  const bucket = path.split('/')[0]
  const filePath = path.split('/').slice(1).join('/')
  return db.storage.from(bucket).upload(filePath, file)
}
export const getDownloadURL = async (path: string) => {
  const bucket = path.split('/')[0]
  const filePath = path.split('/').slice(1).join('/')
  const { data } = db.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
export const storageRef = ref

// --- DATABASE ---

// --- FIRESTORE HELPERS ---
// These helpers map Firestore-like syntax to Supabase calls.
// They are kept as thin wrappers to avoid refactoring 20+ files.

type QueryConstraint = { field?: string; op?: string; value?: unknown; limit?: number; dir?: string; columns?: string }
type QueryObject = { table: string; constraints: QueryConstraint[]; columns: string }

export const collection = (_db: unknown, name: string) => name
export const doc = (_db: unknown, name: string, id: string) => ({ table: name, id })
export const query = (table: string, ...constraints: QueryConstraint[]) => {
  const q: QueryObject = { table, constraints: [] as QueryConstraint[], columns: '*' }
  constraints.forEach(c => {
    if (c.columns) q.columns = c.columns
    else q.constraints.push(c)
  })
  return q
}
export const where = (field: string, op: string, value: unknown): QueryConstraint => ({ field, op, value })
export const limit = (n: number) => ({ limit: n })
export const orderBy = (field: string, dir: string) => ({ field, dir })
export const selectCols = (cols: string) => ({ columns: cols })

export interface FirestoreLikeDoc {
  id: string;
  data: () => Record<string, unknown>;
  exists: () => boolean;
  ref: { table: string; id: string };
}

export interface FirestoreLikeSnapshot {
  docs: FirestoreLikeDoc[];
  empty: boolean;
  size: number;
  docChanges: () => never[];
}

export const getDocs = async (q: QueryObject): Promise<FirestoreLikeSnapshot> => {
  let builder = db.from(q.table).select(q.columns || '*');
  if (q.constraints) {
    q.constraints.forEach((c) => {
      if ((c.op === '==' || c.op === 'eq') && c.field) builder = builder.eq(c.field, c.value);
      if (c.limit) builder = builder.limit(c.limit);
      if (c.field && c.dir) builder = builder.order(c.field, { ascending: c.dir === 'asc' });
    });
  }
  const { data } = await builder;
  const tableName = q.table;
  const docs: FirestoreLikeDoc[] = Array.isArray(data)
    ? data.map((d) => {
        const docData = d as unknown as Record<string, unknown>;
        return {
          id: String(docData.id),
          data: () => docData,
          exists: () => true,
          ref: { table: tableName, id: String(docData.id) },
        };
      })
    : [];
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    docChanges: () => [],
  };
};

export const getDoc = async (docRef: { table: string, id: string }, columns: string = '*') => {
  const { data } = await db.from(docRef.table).select(columns).eq('id', docRef.id).single()
  return {
    id: docRef.id,
    data: () => data,
    exists: () => !!data
  }
}

export const getCountFromServer = async (q: QueryObject | string) => {
  let builder = db.from(typeof q === 'string' ? q : q.table).select('id', { count: 'exact', head: true })
  if (typeof q !== 'string' && q.constraints) {
    q.constraints.forEach((c) => {
      if ((c.op === '==' || c.op === 'eq') && c.field) builder = builder.eq(c.field, c.value)
    })
  }
  const { count } = await builder
  return { data: () => ({ count: count || 0 }) }
}

export const onSnapshot = (q: QueryObject, cb: (snapshot: { docs: { id: string; data: () => Record<string, unknown>; exists: () => boolean; ref: { table: string; id: string } }[]; empty: boolean; size: number; docChanges: () => never[] }) => void) => {
  const channel = db.channel(`snapshot-${q.table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: q.table }, () => {
      getDocs(q).then(cb)
    })
    .subscribe()

  getDocs(q).then(cb)
  return () => {
    void db.removeChannel(channel)
  }
}

export const setDoc = async (docRef: { table: string, id: string }, data: Record<string, unknown>) => {
  return db.from(docRef.table).upsert({ id: docRef.id, ...data })
}
export const updateDoc = async (docRef: { table: string, id: string }, data: Record<string, unknown>) => {
  return db.from(docRef.table).update(data).eq('id', docRef.id)
}
export const deleteDoc = async (docRef: { table: string, id: string }) => {
  return db.from(docRef.table).delete().eq('id', docRef.id)
}
export const addDoc = async (table: string, data: Record<string, unknown>) => {
  return db.from(table).insert(data)
}
export const writeBatch = (_db?: unknown) => {
  const operations: (() => Promise<unknown>)[] = []
  return {
    update: (docRef: { table: string, id: string }, data: Record<string, unknown>) => {
      operations.push(() => updateDoc(docRef, data))
    },
    set: (docRef: { table: string, id: string }, data: Record<string, unknown>) => {
      operations.push(() => setDoc(docRef, data))
    },
    delete: (docRef: { table: string, id: string }) => {
      operations.push(() => deleteDoc(docRef))
    },
    commit: async () => {
      for (const op of operations) {
        await op()
      }
    }
  }
}


// For backward compatibility
export const createClient = () => db
export const createBrowserClient = () => db

export default db
