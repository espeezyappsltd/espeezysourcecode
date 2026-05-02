import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyA90GDtsLFRPAHr01DDhIm0QZGJMO1DSzU',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'espeezylearning.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'espeezylearning',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'espeezylearning.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '521867130243',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:521867130243:web:eb09572762faeccee832b6',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-PHDNYXBXH8',
}

const firestoreDatabaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID?.trim()
const firestoreFlag = process.env.NEXT_PUBLIC_FIREBASE_ENABLE_FIRESTORE

export const firestoreClientEnabled = firestoreFlag === 'true' || (firestoreFlag == null && process.env.VERCEL === '1')

// Prevent re-initialisation during Next.js hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = firestoreDatabaseId && firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app)
export const storage = getStorage(app)
export default app
