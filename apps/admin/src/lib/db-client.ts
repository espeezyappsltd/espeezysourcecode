import { createClient } from './supabase/client'

// Initialize the native Supabase client
export const db = createClient()

/**
 * Cleaned up db-client for Admin application.
 * All legacy Firebase-dependent shims have been removed.
 * This implementation provides a Supabase-native experience while maintaining
 * compatibility with existing code that expects a 'db' or 'client' object.
 */

export const auth = db.auth
export const storage = db.storage

// Helpers to maintain compatibility with code that uses Firestore-like syntax
export const collection = (_db: any, name: string) => name
export const doc = (_db: any, name: string, id: string) => ({ table: name, id })

export const query = (table: string, ...constraints: any[]) => {
  let builder: any = db.from(table).select('*')
  constraints.forEach(c => {
    if (c?.type === 'where') builder = builder.eq(c.field, c.value)
    if (c?.type === 'orderBy') builder = builder.order(c.field, { ascending: c.dir === 'asc' })
    if (c?.type === 'limit') builder = builder.limit(c.value)
  })
  return { table, builder }
}

export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value })
export const orderBy = (field: string, dir: 'asc' | 'desc' = 'asc') => ({ type: 'orderBy', field, dir })
export const limit = (value: number) => ({ type: 'limit', value })

export const getDocs = async (q: any) => {
  const { data, error } = await q.builder
  if (error) throw error
  return {
    docs: (data || []).map((d: any) => ({
      id: d.id,
      data: () => d
    })),
    empty: !data || data.length === 0
  }
}

export const getDoc = async (docRef: any) => {
  const { data, error } = await db.from(docRef.table).select('*').eq('id', docRef.id).single()
  if (error) throw error
  return {
    exists: () => !!data,
    data: () => data,
    id: data?.id
  }
}

export const updateDoc = async (docRef: any, updates: any) => {
  const { error } = await db.from(docRef.table).update(updates).eq('id', docRef.id)
  if (error) throw error
}

export const setDoc = async (docRef: any, data: any) => {
  const { error } = await db.from(docRef.table).upsert({ id: docRef.id, ...data })
  if (error) throw error
}

export const addDoc = async (colName: string, data: any) => {
  const { data: created, error } = await db.from(colName).insert(data).select().single()
  if (error) throw error
  return { id: created.id }
}

export const deleteDoc = async (docRef: any) => {
  const { error } = await db.from(docRef.table).delete().eq('id', docRef.id)
  if (error) throw error
}

export const onSnapshot = (q: any, cb: any) => {
  const channel = db.channel(`public:${q.table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: q.table }, () => {
      // Re-fetch everything on change for simplicity in this shim
      getDocs(q).then(cb)
    })
    .subscribe()
  
  return () => {
    db.removeChannel(channel)
  }
}

export const getCountFromServer = async (q: any) => {
  const { count, error } = await q.builder.count()
  if (error) throw error
  return {
    data: () => ({ count: count || 0 })
  }
}

// ── Realtime DB Shims ──────────────────────────────────────────────────────────
export const database = {} // Token for ref
export const ref = (_db: any, path: string) => ({ path, table: path.split('/')[0] })
export const onValue = (ref: any, cb: any) => {
  if (ref.path === '.info/connected') {
    // Mock connected state
    cb({ val: () => true })
    return () => {}
  }
  
  const channel = db.channel(`rt:${ref.path}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: ref.table }, (payload) => {
      // Very simplified: return the whole table or just the changed row?
      // Realtime DB usually returns the whole node.
      db.from(ref.table).select('*').then(({ data }) => {
        cb({ val: () => data })
      })
    })
    .subscribe()
    
  return () => {
    db.removeChannel(channel)
  }
}
export const set = async (ref: any, data: any) => {
  const { error } = await db.from(ref.table).upsert(data)
  if (error) throw error
}
export const update = async (ref: any, data: any) => {
  const { error } = await db.from(ref.table).update(data).match({ id: ref.path.split('/').pop() })
  if (error) throw error
}
export const push = (ref: any) => ({ ...ref, path: `${ref.path}/${Math.random().toString(36).substring(7)}` })
export const remove = async (ref: any) => {
  const { error } = await db.from(ref.table).delete().match({ id: ref.path.split('/').pop() })
  if (error) throw error
}
export const onDisconnect = (ref: any) => ({ remove: () => {} }) // Mock
export const serverTimestamp = () => new Date().toISOString()
export const runTransaction = async (ref: any, updater: any) => {
  // Mock transaction
  const { data } = await db.from(ref.table).select('*').eq('id', ref.path.split('/').pop()).single()
  const newData = updater(data)
  if (newData) await update(ref, newData)
}

export const writeBatch = (db: any) => ({
  update: (docRef: any, updates: any) => updateDoc(docRef, updates),
  commit: async () => {} // Mock
})

export const onAuthStateChanged = (cb: any) => {
  const { data } = db.auth.onAuthStateChange((_event, session) => {
    cb(session?.user || null)
  })
  return () => data.subscription.unsubscribe()
}

export const createBrowserSupabaseClient = () => db
export const createClientAlias = () => db

export default db
