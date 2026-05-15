import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'

type CommitPayload = {
  id: string
  message: string
  author?: {
    email?: string
  }
}

type WebhookPayload = {
  commits?: CommitPayload[]
}

export async function processTaskCommitWebhook(rawBody: string, signature: string | null) {
  try {
    const adminDb = getAdminDb()
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('GITHUB_WEBHOOK_SECRET is not set. Bypassing validation (NOT FOR PRODUCTION).')
    } else if (signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret)
      const digest = `sha256=${hmac.update(rawBody).digest('hex')}`
      if (signature !== digest) {
        return new NextResponse('Unauthorized: Invalid Signature', { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody) as WebhookPayload
    if (!payload.commits || payload.commits.length === 0) {
      return new NextResponse('No commits to process', { status: 200 })
    }

    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

    for (const commit of payload.commits) {
      const match = commit.message.match(uuidRegex)
      if (!match) continue

      const taskId = match[0]
      const { data: task, error: taskError } = await adminDb
        .from('tasks')
        .select('id, is_coding_task, assignees')
        .eq('id', taskId)
        .single()

      if (taskError || !task?.is_coding_task) {
        continue
      }

      const impactScore = 15

      const { error: commitError } = await adminDb.from('commits').insert({
        hash: commit.id,
        message: commit.message,
        author_email: commit.author?.email ?? null,
        task_id: taskId,
        impact_score: impactScore,
        lines_added: 0,
        lines_deleted: 0,
      })
      if (commitError) {
        throw commitError
      }

      const { error: taskUpdateError } = await adminDb
        .from('tasks')
        .update({ status: 'Done' })
        .eq('id', taskId)
      if (taskUpdateError) {
        throw taskUpdateError
      }

      const assignees = Array.isArray(task.assignees) ? task.assignees.filter(Boolean) : []
      if (assignees.length === 0) {
        continue
      }

      const { data: profiles, error: profilesError } = await adminDb
        .from('profiles')
        .select('id, total_score')
        .in('id', assignees)
      if (profilesError) {
        throw profilesError
      }

      for (const profile of profiles ?? []) {
        const { error: profileUpdateError } = await adminDb
          .from('profiles')
          .update({ total_score: (profile.total_score ?? 0) + impactScore })
          .eq('id', profile.id)
        if (profileUpdateError) {
          throw profileUpdateError
        }
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error('Webhook Error:', msg)
    return new NextResponse(`Server Error: ${msg}`, { status: 500 })
  }
}