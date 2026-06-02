import { NextResponse } from 'next/server'
import { requireStudioOperator } from '@/lib/auth/studio-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildJobInsertPayload, getServerJobSchemaCapabilities } from '@/lib/jobs/schema-capabilities'
import { runAgentTask } from '@/lib/agent/agent-task'

export async function POST(req: Request) {
  const auth = await requireStudioOperator()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const body = await req.json().catch(() => ({}))
  const title = String(body.title ?? '').trim()
  const prompt = String(body.prompt ?? '').trim()
  const clientName = body.clientName ? String(body.clientName).trim() : null
  const clientEmail = body.clientEmail ? String(body.clientEmail).trim() : null

  if (!title) {
    return NextResponse.json({ error: 'A project title is required.' }, { status: 400 })
  }

  if (!prompt) {
    return NextResponse.json({ error: 'An agent prompt is required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const capabilities = await getServerJobSchemaCapabilities(admin)

  const insertPayload = buildJobInsertPayload(
    {
      title,
      description: `Agent task: ${title}`,
      status: 'pending',
      client_name: clientName,
      client_email: clientEmail,
      requirements_text: prompt,
      prd_text: `Agent build prompt:\n\n${prompt}\n\nDeliver a ready-to-deploy Next.js client application for the studio client.`,
      delivery_status: 'draft',
    },
    capabilities,
  )

  const { data: job, error: jobError } = await admin
    .from('jobs')
    .insert([insertPayload])
    .select('*')
    .single()

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message ?? 'Unable to create the agent project.' },
      { status: 500 },
    )
  }

  const taskPayload = {
    job_id: job.id,
    prompt,
    status: 'queued',
    created_by: auth.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: task, error: taskError } = await admin
    .from('studio_agent_tasks')
    .insert([taskPayload])
    .select('*')
    .single()

  if (taskError || !task) {
    return NextResponse.json(
      { error: taskError?.message ?? 'Unable to create the agent task record.' },
      { status: 500 },
    )
  }

  const result = await runAgentTask(admin, task.id, job.id, prompt, auth.user.id)
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'Agent task failed during fulfillment.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, job: result.job ?? job, task: result.task ?? task })
}
