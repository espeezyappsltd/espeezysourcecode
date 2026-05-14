import { createClient as createBrowserSupabaseClient } from './supabase/client'
export { createBrowserSupabaseClient }

// Export a real Supabase client instead of the Firebase shim.
export const db = createBrowserSupabaseClient()

// --- AUTH SHIM ---
export const auth = {
  get currentUser() {
    return {
      uid: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
      displayName: 'Test User',
    }
  },
  signOut: () => db.auth.signOut(),
  onAuthStateChanged: (cb: any) => {
    // Immediate callback for testing
    setTimeout(() => {
      cb({
        uid: '00000000-0000-0000-0000-000000000000',
        email: 'test@example.com',
        displayName: 'Test User',
      });
    }, 0);
    return { subscription: { unsubscribe: () => { } } };
  },
} as any

export const onAuthStateChanged = auth.onAuthStateChanged;

// --- STORAGE SHIM ---
export const storage = db.storage
export const ref = (_storage: any, path: string) => path
export const uploadBytes = async (path: string, file: any) => {
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

// --- DATABASE SHIM ---
export const database = {
  ref: (path: string) => ({
    on: (evt: string, cb: any) => cb({ val: () => ({}) }),
    off: () => { },
    set: async () => { },
    update: async () => { },
    remove: async () => { },
    push: () => ({ key: 'mock-key', set: async () => { } }),
    onDisconnect: () => ({ remove: () => { } }),
  })
} as any

// --- FIRESTORE SHIM ---
export const collection = (_db: any, name: string) => name
export const doc = (_db: any, name: string, id: string) => ({ table: name, id })
export const query = (table: string, ...constraints: any[]) => {
  const q = { table, constraints: [] as any[], columns: '*' }
  constraints.forEach(c => {
    if (c.columns) q.columns = c.columns
    else q.constraints.push(c)
  })
  return q
}
export const where = (field: string, op: string, value: any) => ({ field, op, value })
export const limit = (n: number) => ({ limit: n })
export const orderBy = (field: string, dir: string) => ({ field, dir })
export const selectCols = (cols: string) => ({ columns: cols })

export const getDocs = async (q: any) => {
  let builder: any = db.from(q.table).select(q.columns || '*')
  if (q.constraints) {
    q.constraints.forEach((c: any) => {
      if (c.op === '==' || c.op === 'eq') builder = builder.eq(c.field, c.value)
      if (c.limit) builder = builder.limit(c.limit)
      if (c.field && c.dir) builder = builder.order(c.field, { ascending: c.dir === 'asc' })
    })
  }
  const { data } = await builder
  const tableName = q.table
  return {
    docs: (data ?? []).map((d: any) => ({
      id: d.id,
      data: () => d,
      exists: () => true,
      ref: { table: tableName, id: d.id }
    })),
    empty: (data ?? []).length === 0,
    size: (data ?? []).length,
    docChanges: () => []
  }
}

export const getDoc = async (docRef: any, columns: string = '*') => {
  const { data } = await db.from(docRef.table).select(columns).eq('id', docRef.id).single()
  return {
    id: docRef.id,
    data: () => data,
    exists: () => !!data
  }
}

export const getCountFromServer = async (q: any) => {
  let builder: any = db.from(typeof q === 'string' ? q : q.table).select('id', { count: 'exact', head: true })
  if (q.constraints) {
    q.constraints.forEach((c: any) => {
      if (c.op === '==' || c.op === 'eq') builder = builder.eq(c.field, c.value)
    })
  }
  const { count } = await builder
  return { data: () => ({ count: count || 0 }) }
}

export const onSnapshot = (q: any, cb: any) => {
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

export const setDoc = async (docRef: any, data: any) => {
  return db.from(docRef.table).upsert({ id: docRef.id, ...data })
}
export const updateDoc = async (docRef: any, data: any) => {
  return db.from(docRef.table).update(data).eq('id', docRef.id)
}
export const deleteDoc = async (docRef: any) => {
  return db.from(docRef.table).delete().eq('id', docRef.id)
}
export const addDoc = async (table: string, data: any) => {
  return db.from(table).insert(data)
}
export const writeBatch = (_db?: any) => {
  const operations: (() => Promise<any>)[] = []
  return {
    update: (docRef: any, data: any) => {
      operations.push(() => updateDoc(docRef, data))
    },
    set: (docRef: any, data: any) => {
      operations.push(() => setDoc(docRef, data))
    },
    delete: (docRef: any) => {
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
