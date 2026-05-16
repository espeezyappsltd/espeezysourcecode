'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAdminAuth, getAdminDb } from '@/lib/supabase/admin'
import { validateEmailRateLimit } from '@/utils/email-rate-limit'

export async function login(formData: FormData) {
  const honeypot = formData.get('hp_field') as string;
  if (honeypot) {
    redirect(`/login?error=${encodeURIComponent('Security protocol triggered: Automated access denied.')}`)
  }

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
    
    const { data: createdUser, error: createUserError } = await adminAuth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        school_id,
        legal_accepted,
      }
    })
    
    if (createUserError || !createdUser.user) {
      throw createUserError ?? new Error('Signup failed')
    }

    revalidatePath('/', 'layout')
    redirect('/')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signup failed'
    redirect(`/login?error=${encodeURIComponent(message)}`)
  }
}
