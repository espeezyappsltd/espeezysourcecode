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

    const EXPORT_TASK_LIMIT = 250
    const EXPORT_ARTIFACT_LIMIT = 250

    const [profileResult, tasksResult, artifactsResult] = await Promise.all([
      adminDb
        .from('profiles')
        .select(
          'id, full_name, email, username, avatar_url, role, subscription_plan, tier, created_at, updated_at',
        )
        .eq('id', uid)
        .single(),
      adminDb
        .from('tasks')
        .select('id, title, status, group_id, assignees, created_at, updated_at, due_date')
        .contains('assignees', [uid])
        .order('updated_at', { ascending: false })
        .limit(EXPORT_TASK_LIMIT),
      adminDb
        .from('artifacts')
        .select('id, file_url, task_id, uploaded_by, endorsements_count, created_at')
        .eq('uploaded_by', uid)
        .order('created_at', { ascending: false })
        .limit(EXPORT_ARTIFACT_LIMIT),
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

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error("Export Engine Failure:", msg)
    return new NextResponse(`Server Fault: ${msg}`, { status: 500 })
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

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error("Termination Engine Failure:", msg)
    return new NextResponse(`Server Fault: ${msg}`, { status: 500 })
  }
}
