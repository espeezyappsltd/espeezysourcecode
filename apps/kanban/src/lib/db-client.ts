import { createClient as createSupabaseClient } from './supabase/client'

/** Supabase browser client — no Firebase or Firestore compatibility layer. */
export const db = createSupabaseClient()

export const createClient = () => db
export const createBrowserClient = () => db
export const createBrowserSupabaseClient = () => db

type AuthUser = { id?: string; email?: string }

type SessionHolder = { _session?: { user?: AuthUser } | null }

export const auth = {
  get currentUser() {
    return (db as SessionHolder)._session?.user ?? null
  },
  signOut: () => db.auth.signOut(),
  onAuthStateChanged: (cb: (user: AuthUser | null) => void) => {
    const { data } = db.auth.onAuthStateChange((_event, session) => {
      ;(db as SessionHolder)._session = session
      cb(session?.user ?? null)
    })
    db.auth.getSession().then(({ data: { session } }) => {
      ;(db as SessionHolder)._session = session
      cb(session?.user ?? null)
    })
    return { subscription: { unsubscribe: () => data.subscription.unsubscribe() } }
  },
}

export const onAuthStateChanged = auth.onAuthStateChanged

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

export default db
