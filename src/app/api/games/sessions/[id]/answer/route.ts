import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'


export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
    const signature = req.headers.get('x-hub-signature-256')
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn("GITHUB_WEBHOOK_SECRET is not set. Bypassing validation (NOT FOR PRODUCTION).")
    } else if (signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret)
      const digest = 'sha256=' + hmac.update(rawBody).digest('hex')
      if (signature !== digest) {
        return new NextResponse('Unauthorized: Invalid Signature', { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)

    // Only process push events with commits
    if (!payload.commits || payload.commits.length === 0) {
      return new NextResponse('No commits to process', { status: 200 })
    }

    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    for (const commit of payload.commits) {
      const match = commit.message.match(uuidRegex)
      
      if (match) {
        const taskId = match[0]
        
        // 1. Fetch the Task to find who it's assigned to
        const taskRef = adminDb.collection('tasks').doc(taskId)
        const taskSnap = await taskRef.get()

        if (taskSnap.exists && taskSnap.data()?.is_coding_task) {
           const task = taskSnap.data()!
           const impactScore = 15; // standard base reward
           
           // 2. Record the Commit
           await adminDb.collection('commits').add({
             hash: commit.id,
             message: commit.message,
             author_email: commit.author.email,
             task_id: taskId,
             impact_score: impactScore,
             lines_added: 0,
             lines_deleted: 0,
             created_at: new Date().toISOString()
           })

           // 3. Update Task Status to Done
           await taskRef.update({ status: 'Done' })

           // 4. Update Profile Score across all assignees
           if (task.assignees && Array.isArray(task.assignees)) {
              for (const userId of task.assignees) {
                 const profileRef = adminDb.collection('profiles').doc(userId)
                 const profileSnap = await profileRef.get()
                 if (profileSnap.exists) {
                    const currentScore = profileSnap.data()?.total_score || 0
                    await profileRef.update({ total_score: currentScore + impactScore })
                 }
              }
           }
        }
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 })
    
  } catch (err: any) {
    console.error("Webhook Error:", err.message)
    return new NextResponse(`Server Error: ${err.message}`, { status: 500 })
  }
}
