import { NextResponse } from 'next/server'
import { runTaskWorkflow } from '@/lib/tasks/task-service'
import { createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const db = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  try {
    const payload = await req.json()
    const result = await runTaskWorkflow({ ...payload, userId: user.id })
    return NextResponse.json({ status: 'completed', ...result }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Task save failed.'
    console.error('[task/workflow]', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
