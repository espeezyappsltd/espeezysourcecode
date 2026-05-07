import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyA90GDtsLFRPAHr01DDhIm0QZGJMO1DSzU',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'espeezylearning.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'espeezylearning',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:521867130243:web:eb09572762faeccee832b6',
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
