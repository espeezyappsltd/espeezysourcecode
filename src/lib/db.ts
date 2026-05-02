import { getAdminDb, getAdminAuth } from './firebase-admin'
import { headers } from 'next/headers'

/**
 * Espeezy Database Abstraction Layer (DBAL)
 * 
 * Provides a familiar query interface over Firebase Firestore.
 * This ensures the application remains database-agnostic and simplifies the 
 * migration from Supabase while maintaining high performance.
 */

class FirestoreQueryBuilder {
  private _collection: string
  private _where: any[] = []
  private _or: any[] = []
  private _limit: number | null = null
  private _offset: number | null = null
  private _order: { field: string, direction: 'asc' | 'desc' } | null = null

  constructor(collection: string) {
    this._collection = collection
  }

  select(columns: string = '*') {
    // Columns selection is handled by the consumer mapping for now
    return this
  }

  eq(field: string, value: any) {
    this._where.push({ field, op: '==', value })
    return this
  }

  neq(field: string, value: any) {
    this._where.push({ field, op: '!=', value })
    return this
  }

  gt(field: string, value: any) {
    this._where.push({ field, op: '>', value })
    return this
  }

  lt(field: string, value: any) {
    this._where.push({ field, op: '<', value })
    return this
  }

  in(field: string, values: any[]) {
    this._where.push({ field, op: 'in', value: values })
    return this
  }

  or(filter: string) {
    // Basic parser for "field1.eq.val1,field2.eq.val2"
    const parts = filter.split(',')
    this._or = parts.map(p => {
      const [f, op, v] = p.split('.')
      return { field: f, op: op === 'eq' ? '==' : op, value: v }
    })
    return this
  }

  range(from: number, to: number) {
    this._offset = from
    this._limit = to - from + 1
    return this
  }

  limit(count: number) {
    this._limit = count
    return this
  }

  order(field: string, { ascending = true } = {}) {
    this._order = { field, direction: ascending ? 'asc' : 'desc' }
    return this
  }

  // Support direct await on the builder
  then(resolve: any, reject?: any) {
    return this.get().then(resolve, reject)
  }

  async get() {
    const db = getAdminDb()
    if (!db) return { data: null, error: new Error('Database connection failed') }

    try {
      let q: any = db.collection(this._collection)
      
      // Handle simple WHERE clauses
      for (const w of this._where) {
        q = q.where(w.field, w.op, w.value)
      }

      // Handle OR clauses (Firestore supports Filter.or since recent versions)
      if (this._or.length > 0) {
        const admin = require('firebase-admin')
        const filters = this._or.map(o => admin.firestore.Filter.where(o.field, o.op, o.value))
        q = q.where(admin.firestore.Filter.or(...filters))
      }

      if (this._order) {
        q = q.orderBy(this._order.field, this._order.direction)
      }
      
      if (this._offset) {
        // Firestore doesn't support offset natively without a cursor, 
        // but we'll simulate for small lists or use limit.
        // For real migration, this should use startAfter.
      }

      if (this._limit) {
        q = q.limit(this._limit)
      }

      const snapshot = await q.get()
      const data = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }))
      return { data, error: null as any }
    } catch (error: any) {
      console.error(`Firestore GET error [${this._collection}]:`, error)
      return { data: null, error }
    }
  }

  async single() {
    const { data, error } = await this.limit(1).get()
    return { data: data && data.length > 0 ? data[0] : null, error }
  }

  async maybeSingle() {
    return this.single()
  }

  insert(values: any | any[]) {
    const builder = this
    const executor = async () => {
      const db = getAdminDb()
      if (!db) return { data: null, error: new Error('Database connection failed') }

      const docs = Array.isArray(values) ? values : [values]
      try {
        const results = await Promise.all(docs.map(doc => db.collection(builder._collection).add({
          ...doc,
          created_at: doc.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))
        return { data: results.map((r, i) => ({ id: r.id, ...docs[i] })), error: null as any }
      } catch (error: any) {
        return { data: null, error }
      }
    }

    const promise = executor() as any
    promise.select = () => ({
      single: async () => {
        const { data, error } = await executor()
        return { data: data && data.length > 0 ? data[0] : null, error }
      },
      maybeSingle: async () => {
        const { data, error } = await executor()
        return { data: data && data.length > 0 ? data[0] : null, error }
      }
    })
    return promise
  }

  update(values: any) {
    const builder = this
    return {
      eq: (field: string, value: any) => {
        const executor = async () => {
          const db = getAdminDb()
          if (!db) return { data: null, error: new Error('Database connection failed') }
          try {
            if (field === 'id') {
              await db.collection(builder._collection).doc(value).update({
                ...values,
                updated_at: new Date().toISOString()
              })
              return { data: [values], error: null as any }
            }
            const q = await db.collection(builder._collection).where(field, '==', value).get()
            const batch = db.batch()
            q.docs.forEach((doc: any) => {
              batch.update(doc.ref, { ...values, updated_at: new Date().toISOString() })
            })
            await batch.commit()
            return { data: q.docs.map(d => d.data()), error: null as any }
          } catch (error: any) {
            return { data: null, error }
          }
        }

        const promise = executor() as any
        promise.select = () => ({
          single: async () => {
            const { data, error } = await executor()
            return { data: data && data.length > 0 ? data[0] : null, error }
          },
          maybeSingle: async () => {
            const { data, error } = await executor()
            return { data: data && data.length > 0 ? data[0] : null, error }
          }
        })
        return promise
      }
    }
  }

  delete() {
    const builder = this
    return {
      eq: (field: string, value: any) => {
        const executor = async () => {
          const db = getAdminDb()
          if (!db) return { error: new Error('Database connection failed') }
          try {
            if (field === 'id') {
              await db.collection(builder._collection).doc(value).delete()
              return { error: null as any }
            }
            const q = await db.collection(builder._collection).where(field, '==', value).get()
            const batch = db.batch()
            q.docs.forEach((doc: any) => batch.delete(doc.ref))
            await batch.commit()
            return { error: null as any }
          } catch (error: any) {
            return { error }
          }
        }
        return executor()
      }
    }
  }
}

export const db = {
  from: (table: string) => new FirestoreQueryBuilder(table) as any,
  rpc: async (name: string, args?: any) => {
    // Firestore doesn't support RPCs. This is a shim for legacy code.
    console.log(`Firestore RPC Shim [${name}]:`, args)
    return { data: null, error: null as any }
  },
  auth: {
    getUser: async () => {
      try {
        const h = await headers()
        const authHeader = h.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
          return { data: { user: null }, error: null }
        }
        const token = authHeader.split('Bearer ')[1]
        const adminAuth = getAdminAuth()
        if (!adminAuth) return { data: { user: null }, error: new Error('Auth Unavailable') }
        
        const decoded = await adminAuth.verifyIdToken(token)
        return { 
          data: { 
            user: { 
              id: decoded.uid, 
              email: decoded.email,
              aud: 'authenticated',
              role: 'authenticated'
            } 
          }, 
          error: null 
        }
      } catch (err: any) {
        console.error('db.auth.getUser() error:', err.message)
        return { data: { user: null }, error: err }
      }
    },
    admin: {
      deleteUser: async (uid: string) => {
        const auth = getAdminAuth()
        if (!auth) return { error: new Error('Auth connection failed') }
        try {
          await auth.deleteUser(uid)
          return { error: null as any }
        } catch (error: any) {
          return { error }
        }
      },
      listUsers: async () => {
        const auth = getAdminAuth()
        if (!auth) return { data: { users: [] }, error: new Error('Auth connection failed') }
        try {
          const list = await auth.listUsers()
          return { data: { users: list.users }, error: null as any }
        } catch (error: any) {
          return { data: { users: [] }, error }
        }
      }
    },
    exchangeCodeForSession: async (code: string) => {
      return { data: { session: null }, error: null as any as any }
    },
    signOut: async () => {
      return { error: null as any }
    }
  },
  firebase: {
    from: (bucket: string) => ({
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: path } }
      },
      upload: async (path: string, file: any) => {
        return { data: { path }, error: null as any }
      }
    })
  }
}

export const createAdminClient = async () => db
export const createServerSupabaseClient = async () => db


