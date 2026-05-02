import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const { email, source } = body as Record<string, unknown>

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanSource = typeof source === 'string' ? source.slice(0, 50) : 'organic'

    // Hash IP for deduplication without storing raw IP
    const ipHeader = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const ip = ipHeader.split(',')[0].trim()
    const ipHash = createHash('sha256').update(ip + (process.env.IP_HASH_SALT ?? 'fallback')).digest('hex').slice(0, 16)

    const emailsRef = adminDb.collection('pre_registrations')

    // Check for duplicate email
    const existing = await emailsRef.where('email', '==', cleanEmail).limit(1).get()
    if (!existing.empty) {
      return NextResponse.json({
        success: true,
        message: 'You are already registered! We will be in touch.',
      })
    }

    // Store the email
    await emailsRef.add({
      email: cleanEmail,
      source: cleanSource,
      ip_hash: ipHash,
      user_agent: (req.headers.get('user-agent') ?? '').slice(0, 500),
      created_at: new Date().toISOString(),
    })

    // Get updated count
    const countSnap = await emailsRef.count().get()
    const count = countSnap.data().count

    return NextResponse.json({
      success: true,
      message: 'You are on the list! We will notify you at launch.',
      count,
    })
  } catch (err) {
    if (isFirestoreNotFound(err)) {
      console.warn('[preregister] Firestore database not found — create it in Firebase Console (Firestore Database → Create database)')
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
    }
    console.error('[preregister] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

function isFirestoreNotFound(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 5
}

export async function GET() {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ count: 0 })
    const countSnap = await adminDb.collection('pre_registrations').count().get()
    return NextResponse.json({ count: countSnap.data().count })
  } catch (err) {
    if (isFirestoreNotFound(err)) {
      console.warn('[preregister] Firestore database not found — create it in Firebase Console (Firestore Database → Create database)')
      return NextResponse.json({ count: 0 })
    }
    console.error('[preregister] Count error:', err)
    return NextResponse.json({ count: 0 })
  }
}
