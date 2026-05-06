import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { createHash, randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function isValidReferralCode(code: unknown): code is string {
  if (typeof code !== 'string') return false
  return /^[A-Z0-9]{8}$/.test(code)
}

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const { email, source, referrer_code } = body as Record<string, unknown>

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanSource = typeof source === 'string' ? source.slice(0, 50) : 'organic'
    const cleanReferrerCode = isValidReferralCode(referrer_code) ? referrer_code : null

    // Hash IP for deduplication without storing raw IP
    const ipHeader = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const ip = ipHeader.split(',')[0].trim()
    const ipHash = createHash('sha256').update(ip + (process.env.IP_HASH_SALT ?? 'fallback')).digest('hex').slice(0, 16)

    const emailsRef = adminDb.collection('pre_registrations')

    // Check for duplicate email
    const existing = await emailsRef.where('email', '==', cleanEmail).limit(1).get()
    if (!existing.empty) {
      const existingDoc = existing.docs[0]
      return NextResponse.json({
        success: true,
        message: 'You are already registered! We will be in touch.',
        referral_code: existingDoc.data().referral_code || null,
        referral_count: existingDoc.data().referral_count || 0,
      })
    }

    // Generate unique referral code for this user
    const newReferralCode = generateReferralCode()

    // Store the email
    await emailsRef.add({
      email: cleanEmail,
      source: cleanSource,
      ip_hash: ipHash,
      user_agent: (req.headers.get('user-agent') ?? '').slice(0, 500),
      referral_code: newReferralCode,
      referrer_code: cleanReferrerCode,
      referral_count: 0,
      created_at: new Date().toISOString(),
    })

    // If referred by someone, increment their referral count
    if (cleanReferrerCode) {
      const referrerQuery = await emailsRef.where('referral_code', '==', cleanReferrerCode).limit(1).get()
      if (!referrerQuery.empty) {
        const referrerDoc = referrerQuery.docs[0]
        await referrerDoc.ref.update({
          referral_count: (referrerDoc.data().referral_count || 0) + 1,
        })
      }
    }

    // Send welcome email via Resend (non-blocking)
    if (process.env.RESEND_API_KEY) {
      const shareUrl = `https://espeezy.com/preregister?ref=${newReferralCode}`
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Espeezy <hello@espeezy.com>',
          to: cleanEmail,
          subject: "You're on the list 🚀 + share your link",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; max-width: 600px;">
              <h1 style="margin: 0 0 16px; font-size: 24px;">You're on the list! 🎉</h1>
              <p style="margin: 0 0 12px; line-height: 1.5; color: #666;">
                You're in the first cohort to join Espeezy. We're building something special for students who are tired of unfair group work.
              </p>
              <p style="margin: 0 0 20px; line-height: 1.5; color: #666;">
                <strong>Refer your friends & get perks:</strong> Share your link below. Top referrers get 6 months free when we launch.
              </p>
              <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                <code style="font-size: 14px; word-break: break-all;">${shareUrl}</code>
              </div>
              <p style="margin: 0; color: #999; font-size: 12px;">
                We'll announce the launch here first.
              </p>
            </div>
          `,
        }),
      }).catch(err => {
        console.warn('[preregister] Resend email failed (non-blocking):', err)
      })
    }

    // Get updated count
    const countSnap = await emailsRef.count().get()
    const count = countSnap.data().count

    return NextResponse.json({
      success: true,
      message: 'You are on the list! We will notify you at launch.',
      referral_code: newReferralCode,
      referral_count: 0,
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
