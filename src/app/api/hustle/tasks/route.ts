import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

// GET /api/hustle/tasks — list tasks (with filters)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Service Unavailable (Build)' }, { status: 503 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'open'
    const mine = searchParams.get('mine') === '1'
    const category = searchParams.get('category')
    const cursor = searchParams.get('cursor')
    const PAGE_SIZE = 20

    let query: any = adminDb.collection('hustle_tasks')
      .orderBy('created_at', 'desc')
      .limit(PAGE_SIZE + 1)

    if (mine) {
      query = query.where('poster_id', '==', uid)
    } else {
      query = query.where('status', '==', status)
    }

    if (category) query = query.where('category', '==', category)
    if (cursor) query = query.startAfter(cursor)

    const snap = await query.get()
    const tasks = await Promise.all(snap.docs.map(async (doc: any) => {
      const data = doc.data()
      // Manual join for poster/assignee
      const [posterSnap, assigneeSnap] = await Promise.all([
        adminDb.collection('profiles').doc(data.poster_id).get(),
        data.assignee_id ? adminDb.collection('profiles').doc(data.assignee_id).get() : Promise.resolve(null)
      ])
      
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at,
        poster: posterSnap.exists ? { id: posterSnap.id, ...posterSnap.data() } : null,
        assignee: assigneeSnap?.exists ? { id: assigneeSnap.id, ...assigneeSnap.data() } : null
      }
    }))

    const hasMore = tasks.length > PAGE_SIZE
    const finalTasks = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks
    const nextCursor = hasMore ? finalTasks[finalTasks.length - 1].created_at : null

    return NextResponse.json({ tasks: finalTasks, nextCursor })
  } catch (err: any) {
    console.error('Hustle Tasks Fetch Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/hustle/tasks — create a task
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const profileSnap = await adminDb.collection('profiles').doc(uid).get()
    if (profileSnap.data()?.account_status !== 'active' && profileSnap.data()?.account_status !== undefined) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    }

    const { title, description, category, payout_cents, deadline, connection_only } = await req.json()

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }
    if (!payout_cents || payout_cents < 100 || payout_cents > 500000) {
      return NextResponse.json({ error: 'Payout must be between $1 and $5,000' }, { status: 400 })
    }

    const VALID_CATEGORIES = ['design', 'writing', 'coding', 'tutoring', 'research', 'admin', 'marketing', 'video', 'photography', 'other']
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const taskRef = await adminDb.collection('hustle_tasks').add({
      poster_id: uid,
      title: title.trim(),
      description: description.trim(),
      category,
      payout_cents: Math.round(payout_cents),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      connection_only: !!connection_only,
      status: 'open',
      created_at: new Date().toISOString()
    })

    const taskSnap = await taskRef.get()

    return NextResponse.json({ task: { id: taskSnap.id, ...taskSnap.data() } }, { status: 201 })
  } catch (err: any) {
    console.error('Task creation error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
