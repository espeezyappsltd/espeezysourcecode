import { NextResponse } from 'next/server'
import { requireDevHubAuth } from '@/lib/dev-hub/api'
import { startApp, getAppRuntime } from '@/lib/dev-hub/process-manager'
import { getDevApp } from '@/lib/dev-hub/registry'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireDevHubAuth()
  if (denied) return denied

  const { id } = await ctx.params
  if (!getDevApp(id)) {
    return NextResponse.json({ error: 'Unknown app' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const port =
    typeof body.port === 'number'
      ? body.port
      : body.port != null
        ? parseInt(String(body.port), 10)
        : undefined

  const runtime = startApp(id, Number.isFinite(port) ? port : undefined)
  return NextResponse.json({ runtime: getAppRuntime(id) ?? runtime })
}
