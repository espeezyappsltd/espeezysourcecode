import { NextResponse } from 'next/server'
import { taskWorkflow } from '@/workflows/taskWorkflow'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { start } from '@/utils/workflow'
export const dynamic = 'force-dynamic'


export async function POST(req: Request) {
  const db = await createServerSupabaseClient()
  const { data: { user }, error: userError } = await db.auth.getUser()

  if (userError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Authentication required.' }), { status: 401 })
  }

  const payload = await req.json()
  const workflowPayload = { ...payload, userId: user.id }

  try {
    const run = await start(taskWorkflow, [workflowPayload])
    return NextResponse.json({ runId: run.runId, status: await run.status }, { status: 202 })
  } catch (err: unknown) {
    return new NextResponse(JSON.stringify({ error: (err instanceof Error ? err.message : null) || 'Workflow startup failed.' }), { status: 500 })
  }
}
