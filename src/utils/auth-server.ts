import { cookies } from 'next/headers'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

export async function getAuthUser() {
  const adminAuth = getAdminAuth()
  if (!adminAuth) return null
  const sessionCookie = (await cookies()).get('__session')?.value
  if (!sessionCookie) return null
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims
  } catch (e) {
    return null
  }
}

export async function getUid() {
  const adminAuth = getAdminAuth()
  if (!adminAuth) return null
  const sessionCookie = (await cookies()).get('__session')?.value
  if (!sessionCookie) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie)
    return decoded.uid
  } catch {
    return null
  }
}

export async function getUserProfile(uid: string) {
  const adminDb = getAdminDb()
  if (!adminDb) return null
  const doc = await adminDb.collection('profiles').doc(uid).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() }
}
