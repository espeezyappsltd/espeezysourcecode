import { NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb, getRequestUser } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'


// Mock checkBotId as it's legacy and caused build failures
const checkBotId = async () => ({ isBot: false })

export async function GET(req: Request) {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      return new NextResponse('Unauthorized Pipeline', { status: 401 })
    }
    const adminDb = getAdminDb()
    const uid = user.id

    const [profileResult, tasksResult, artifactsResult] = await Promise.all([
      adminDb.from('profiles').select('*').eq('id', uid).single(),
      adminDb.from('tasks').select('*').contains('assignees', [uid]),
      adminDb.from('artifacts').select('*').eq('uploaded_by', uid),
    ])

    if (profileResult.error) {
      return new NextResponse(`Server Fault: ${profileResult.error.message}`, { status: 500 })
    }
    if (!profileResult.data) {
      return new NextResponse('Profile Not Found', { status: 404 })
    }

    if (tasksResult.error || artifactsResult.error) {
      return new NextResponse(
        `Server Fault: ${tasksResult.error?.message ?? artifactsResult.error?.message}`,
        { status: 500 }
      )
    }

    const profileData = profileResult.data
    const tasksData = tasksResult.data ?? []
    const artifactsData = artifactsResult.data ?? []

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
    const user = await getRequestUser(req)
    if (!user) {
      return new NextResponse('Unauthorized Pipeline', { status: 401 })
    }
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    const uid = user.id

    const { error: deleteAuthError } = await adminAuth.admin.deleteUser(uid)
    if (deleteAuthError) {
      return new NextResponse(`Server Fault: ${deleteAuthError.message}`, { status: 500 })
    }
    
    const { error: deleteProfileError } = await adminDb.from('profiles').delete().eq('id', uid)
    if (deleteProfileError) {
      return new NextResponse(`Server Fault: ${deleteProfileError.message}`, { status: 500 })
    }

    return new NextResponse('Account successfully terminated.', { status: 200 })

  } catch (err: any) {
    console.error("Termination Engine Failure:", err.message)
    return new NextResponse(`Server Fault: ${err.message}`, { status: 500 })
  }
}
