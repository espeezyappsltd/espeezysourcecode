import { auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage } from './firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'

type QueryFilter = {
  field: string
  op: string
  value: unknown
}

const parseSelectColumns = (columns: string) => {
  if (!columns || columns.trim() === '*' || columns.trim().length === 0) {
    return null
  }

  return columns
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
}

const projectRow = (row: Record<string, unknown>, columns: string[] | null) => {
  if (!columns) return row
  const projected: Record<string, unknown> = { id: row.id }
  for (const col of columns) {
    if (col in row) projected[col] = row[col]
  }
  return projected
}

const normalizeLikeToken = (value: string) => value.replace(/%/g, '').toLowerCase()

const getCurrentUser = (): Promise<User | null> => {
  if (firebaseAuth.currentUser) {
    return Promise.resolve(firebaseAuth.currentUser)
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

class ClientQueryBuilder {
  private readonly table: string
  private filters: QueryFilter[] = []
  private rowLimit: number | null = null
  private sort: { field: string; ascending: boolean } | null = null
  private selectColumns: string[] | null = null
  private selectHead = false
  private shouldCount = false

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.selectColumns = parseSelectColumns(columns)
    this.shouldCount = options?.count === 'exact'
    this.selectHead = Boolean(options?.head)
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, op: '==', value })
    return this
  }

  neq(field: string, value: unknown) {
    this.filters.push({ field, op: '!=', value })
    return this
  }

  in(field: string, values: unknown[]) {
    this.filters.push({ field, op: 'in', value: values })
    return this
  }

  not(field: string, op: string, value: unknown) {
    if (op === 'is' && value === null) {
      this.filters.push({ field, op: '!=', value: null })
      return this
    }

    if (op === 'eq') {
      this.filters.push({ field, op: '!=', value })
      return this
    }

    throw new Error(`Unsupported .not() operation: ${op}`)
  }

  ilike(field: string, pattern: string) {
    this.filters.push({ field, op: 'ilike', value: pattern })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sort = { field, ascending: options?.ascending ?? true }
    return this
  }

  limit(count: number) {
    this.rowLimit = count
    return this
  }

  delete() {
    return new MutationBuilder(this.table, 'delete', null, this.filters)
  }

  update(values: Record<string, unknown>) {
    return new MutationBuilder(this.table, 'update', values, this.filters)
  }

  upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }) {
    return new MutationBuilder(this.table, 'upsert', values, this.filters, options?.onConflict)
  }

  async insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    const docs = Array.isArray(values) ? values : [values]

    try {
      const refs = await Promise.all(docs.map((item) => addDoc(collection(firebaseDb, this.table), item)))
      return { data: refs.map((r) => ({ id: r.id })), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async single() {
    const { data, error } = await this.limit(1).get()
    const row = Array.isArray(data) ? (data[0] ?? null) : null
    return { data: row, error }
  }

  async maybeSingle() {
    return this.single()
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.get().then(onfulfilled as any, onrejected as any)
  }

  async get() {
    try {
      let q: any = query(collection(firebaseDb, this.table))
      let clientSideLike: QueryFilter[] = []

      for (const f of this.filters) {
        if (f.op === 'ilike') {
          clientSideLike.push(f)
          continue
        }

        const isIdField = f.field === 'id'
        const targetField = isIdField ? documentId() : f.field
        q = query(q, where(targetField as any, f.op as any, f.value as any))
      }

      if (this.sort) {
        const sortField = this.sort.field === 'id' ? documentId() : this.sort.field
        q = query(q, orderBy(sortField as any, this.sort.ascending ? 'asc' : 'desc'))
      }

      if (this.rowLimit) {
        q = query(q, fsLimit(this.rowLimit))
      }

      const snapshot = await getDocs(q)
      let data: Record<string, unknown>[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      }))

      if (clientSideLike.length > 0) {
        data = data.filter((row) => {
          return clientSideLike.every((f) => {
            const rowVal = row[f.field as keyof typeof row]
            if (typeof rowVal !== 'string' || typeof f.value !== 'string') return false
            return rowVal.toLowerCase().includes(normalizeLikeToken(f.value))
          })
        })
      }

      data = data.map((row) => projectRow(row, this.selectColumns))

      if (this.selectHead) {
        return { data: null, count: data.length, error: null }
      }

      return {
        data,
        count: this.shouldCount ? data.length : null,
        error: null,
      }
    } catch (error) {
      return { data: null, count: 0, error }
    }
  }
}

class MutationBuilder {
  private readonly table: string
  private readonly mode: 'update' | 'delete' | 'upsert'
  private values: any
  private filters: QueryFilter[]
  private onConflict?: string

  constructor(
    table: string,
    mode: 'update' | 'delete' | 'upsert',
    values: any,
    filters: QueryFilter[] = [],
    onConflict?: string,
  ) {
    this.table = table
    this.mode = mode
    this.values = values
    this.filters = [...filters]
    this.onConflict = onConflict
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, op: '==', value })
    return this
  }

  neq(field: string, value: unknown) {
    this.filters.push({ field, op: '!=', value })
    return this
  }

  in(field: string, values: unknown[]) {
    this.filters.push({ field, op: 'in', value: values })
    return this
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any)
  }

  private async resolveTargetDocIds() {
    const explicitId = this.filters.find((f) => f.field === 'id' && f.op === '==')
    if (explicitId && typeof explicitId.value === 'string') {
      return [explicitId.value]
    }

    let q: any = query(collection(firebaseDb, this.table))
    for (const f of this.filters) {
      const isIdField = f.field === 'id'
      const targetField = isIdField ? documentId() : f.field
      q = query(q, where(targetField as any, f.op as any, f.value as any))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => d.id)
  }

  private async runUpsert() {
    const rows = Array.isArray(this.values) ? this.values : [this.values]
    const conflictField = this.onConflict ?? 'id'

    const refs: string[] = []

    for (const row of rows) {
      const conflictValue = row?.[conflictField]
      if (typeof conflictValue === 'string' && conflictValue.length > 0) {
        const q = query(collection(firebaseDb, this.table), where(conflictField, '==', conflictValue), fsLimit(1))
        const existing = await getDocs(q)
        if (!existing.empty) {
          const target = existing.docs[0]
          await updateDoc(target.ref, row)
          refs.push(target.id)
          continue
        }
      }

      const created = await addDoc(collection(firebaseDb, this.table), row)
      refs.push(created.id)
    }

    return { data: refs.map((id) => ({ id })), error: null }
  }

  async execute() {
    try {
      if (this.mode === 'upsert') {
        return await this.runUpsert()
      }

      const ids = await this.resolveTargetDocIds()
      if (ids.length === 0) {
        return { data: [], error: null }
      }

      if (this.mode === 'delete') {
        await Promise.all(ids.map((id) => deleteDoc(doc(firebaseDb, this.table, id))))
        return { data: [], error: null }
      }

      if (this.mode === 'update') {
        const batch = writeBatch(firebaseDb)
        for (const id of ids) {
          batch.update(doc(firebaseDb, this.table, id), this.values)
        }
        await batch.commit()

        const docs = await Promise.all(ids.map((id) => getDoc(doc(firebaseDb, this.table, id))))
        return {
          data: docs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })),
          error: null,
        }
      }

      return { data: null, error: new Error('Unsupported mutation mode') }
    } catch (error) {
      return { data: null, error }
    }
  }
}

const buildOAuthProvider = (provider: string) => {
  if (provider === 'google') return new GoogleAuthProvider()
  if (provider === 'github') return new GithubAuthProvider()
  throw new Error(`Unsupported OAuth provider: ${provider}`)
}

const client = {
  from: (table: string) => new ClientQueryBuilder(table) as any,
  rpc: async (name: string, args?: Record<string, unknown>) => {
    console.warn(`RPC not supported on Firebase client: ${name}`, args)
    return { data: null, error: new Error('RPC not supported on Firebase client') }
  },
  auth: {
    getUser: async () => {
      try {
        const user = await getCurrentUser()
        return { data: { user: user as any }, error: null }
      } catch (error) {
        return { data: { user: null }, error }
      }
    },
    getSession: async () => {
      try {
        const user = await getCurrentUser()
        return { data: { session: user ? { user: user as any } : null }, error: null }
      } catch (error) {
        return { data: { session: null }, error }
      }
    },
    signInWithOAuth: async (options: { provider: string }) => {
      try {
        const provider = buildOAuthProvider(options.provider)
        await signInWithRedirect(firebaseAuth, provider)
        return { data: { url: null }, error: null }
      } catch (error) {
        return { data: { url: null }, error }
      }
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        const result = await signInWithEmailAndPassword(firebaseAuth, credentials.email, credentials.password)
        return { data: { user: result.user as any }, error: null }
      } catch (error) {
        return { data: { user: null }, error }
      }
    },
    signInWithOtp: async () => {
      return { error: new Error('Phone OTP sign-in is not configured in Firebase shim') }
    },
    verifyOtp: async () => {
      return { data: { user: null }, error: new Error('Phone OTP verification is not configured in Firebase shim') }
    },
    signUp: async () => {
      return { data: { user: null }, error: new Error('Sign-up is not implemented in Firebase shim') }
    },
    resetPasswordForEmail: async () => {
      return { data: null, error: new Error('Password reset is not implemented in Firebase shim') }
    },
    updateUser: async () => {
      return { data: { user: null }, error: new Error('User update is not implemented in Firebase shim') }
    },
    exchangeCodeForSession: async () => {
      return { data: { session: null }, error: null }
    },
    signOut: async () => {
      try {
        await firebaseSignOut(firebaseAuth)
        return { error: null }
      } catch (error) {
        return { error }
      }
    },
  },
  storage: {
    from: (_bucket: string) => ({
      getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
      upload: async (path: string, file: Blob | Uint8Array | ArrayBuffer) => {
        try {
          const ref = storageRef(firebaseStorage, path)
          await uploadBytes(ref, file as any)
          const publicUrl = await getDownloadURL(ref)
          return { data: { path, publicUrl }, error: null }
        } catch (error) {
          return { data: null, error }
        }
      },
    }),
  },
  channel: (name: string) => {
    let eventHandlers: Array<{ event: string; filter: any; callback: () => void }> = []
    let unsubscribeFn: (() => void) | null = null

    return {
      on: (eventType: string, filter: any, callback: () => void) => {
        eventHandlers.push({ event: eventType, filter, callback })
        return {
          subscribe: () => {
            // Only set up listener on first subscribe
            if (unsubscribeFn) return { unsubscribe: () => unsubscribeFn?.() }

            // Extract table name from filter
            const tableName = filter?.table
            if (!tableName) return { unsubscribe: () => {} }

            try {
              // Build Firestore query with filters
              const col = collection(firebaseDb, tableName)
              let q = query(col)

              // Apply filter conditions if present
              if (filter?.filter) {
                const conditions = []
                // Parse simple filters like "group_id=eq.123"
                const filterParts = filter.filter.split(',')
                for (const part of filterParts) {
                  const match = part.match(/(\w+)=eq\.(.+)/)
                  if (match) {
                    const [, field, value] = match
                    // Try to parse as number
                    const parsedValue = /^\d+$/.test(value) ? parseInt(value, 10) : value
                    conditions.push(where(field, '==', parsedValue))
                  }
                }
                if (conditions.length > 0) {
                  q = query(col, ...conditions)
                }
              }

              // Subscribe to changes
              unsubscribeFn = onSnapshot(q, () => {
                // Call all registered callbacks
                for (const handler of eventHandlers) {
                  handler.callback()
                }
              })

              return {
                unsubscribe: () => {
                  unsubscribeFn?.()
                  unsubscribeFn = null
                  eventHandlers = []
                },
              }
            } catch {
              // Fallback if listener setup fails
              return { unsubscribe: () => {} }
            }
          },
        }
      },
    }
  },
  removeChannel: async (channel: any) => {
    if (channel?.unsubscribe) {
      channel.unsubscribe()
    }
  },
  removeAllChannels: async () => {
    // Channels handle their own cleanup via unsubscribe
  },
}

export const db = client as any
export const createBrowserSupabaseClient = () => client as any
export const createClient = () => client as any
