'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { validateEmailRateLimit } from '@/utils/email-rate-limit'

export async function login(formData: FormData) {
  const honeypot = formData.get('hp_field') as string;
  if (honeypot) {
    redirect(`/login?error=${encodeURIComponent('Security protocol triggered: Automated access denied.')}`)
  }

  // NOTE: Firebase login is typically handled client-side to get the ID token.
  // This server action is a placeholder or can be used for session verification.
  // For now, we redirect to a client-side login flow or assume the client handles it.
  // If the user is using Firebase UI or similar, this might not be needed.
  
  // However, for compatibility with the existing form, we'll suggest client-side login.
  redirect('/login?error=' + encodeURIComponent('Please sign in using the secure terminal interface.'))
}

export async function signup(formData: FormData) {
  const honeypot = formData.get('hp_field') as string;
  if (honeypot) {
    redirect(`/login?error=${encodeURIComponent('Security protocol triggered: Automated access denied.')}`)
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const school_id = formData.get('school_id') as string
  const legal_accepted = formData.get('legal_accepted') === 'on'

  if (!legal_accepted) {
    redirect(`/login?error=${encodeURIComponent('You must accept the legal policies to continue.')}`)
  }

  const requestHeaders = await headers()
  const ip =
    requestHeaders.get('x-forwarded-for')?.split(',')[0].trim() ||
    requestHeaders.get('x-real-ip') ||
    'unknown'

  const limit = validateEmailRateLimit(email, ip)
  if (!limit.allowed) {
    redirect(
      `/login?error=${encodeURIComponent(limit.message ?? 'Too many signup attempts. Please try again later.')}`
    )
  }

  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) redirect(`/login?error=${encodeURIComponent('Service Unavailable')}`)
    
    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
    })

    // 2. Create profile in Firestore
    await adminDb.collection('profiles').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      school_id,
      legal_accepted: true,
      total_score: 0,
      created_at: new Date().toISOString()
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (err: any) {
    redirect(`/login?error=${encodeURIComponent(err.message)}`)
  }
}
