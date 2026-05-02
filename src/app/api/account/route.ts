import { NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { auth } from '@/lib/firebase' // For client-side auth state if needed, but this is an API route
export const dynamic = 'force-dynamic'


// Mock checkBotId as it's legacy and caused build failures
const checkBotId = async () => ({ isBot: false })

export async function GET(req: Request) {
  try {
    // Get session token from cookies/headers (assuming Firebase session cookie or Bearer token)
    // For now, we'll implement a simple check.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized Pipeline', { status: 401 })
    }
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) return new NextResponse('Service Unavailable', { status: 503 })

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Fetch all data concurrently from Firestore
    const [profileSnap, tasksSnap, artifactsSnap] = await Promise.all([
      adminDb.collection('profiles').doc(uid).get(),
      adminDb.collection('tasks').where('assignees', 'array-contains', uid).get(),
      adminDb.collection('artifacts').where('uploaded_by', '==', uid).get(),
    ])

    if (!profileSnap.exists) {
      return new NextResponse('Profile Not Found', { status: 404 })
    }

    const profileData = profileSnap.data()
    const tasksData = tasksSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    const artifactsData = artifactsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    // Assemble "Takeout" Package
    const exportData = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      identity: profileData,
      execution_log: tasksData,
      evidence_ledger: artifactsData
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="Espeezy-archive-${uid}.json"`
      }
    })

  } catch (err: any) {
    console.error("Export Engine Failure:", err.message)
    return new NextResponse(`Server Fault: ${err.message}`, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized Pipeline', { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) return new NextResponse('Service Unavailable', { status: 503 })
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    // 1. Delete user from Firebase Auth
    await adminAuth.deleteUser(uid)
    
    // 2. Delete profile from Firestore (assuming a profile document exists)
    await adminDb.collection('profiles').doc(uid).delete()

    return new NextResponse('Account successfully terminated.', { status: 200 })

  } catch (err: any) {
    console.error("Termination Engine Failure:", err.message)
    return new NextResponse(`Server Fault: ${err.message}`, { status: 500 })
  }
}
