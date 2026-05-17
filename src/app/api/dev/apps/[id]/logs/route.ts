import { NextResponse } from 'next/server'
import { requireDevHubAuth } from '@/lib/dev-hub/api'
import { getAppRuntime } from '@/lib/dev-hub/process-manager'
import { getDevApp } from '@/lib/dev-hub/registry'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireDevHubAuth()
  if (denied) return denied

  const { id } = await ctx.params
  if (!getDevApp(id)) {
    return NextResponse.json({ error: 'Unknown app' }, { status: 404 })
  }

  const runtime = getAppRuntime(id)
  return NextResponse.json({ logs: runtime?.logs ?? [] })
}
