import { NextResponse } from 'next/server'
import { requireDevHubAuth } from '@/lib/dev-hub/api'
import { clampPort } from '@/lib/dev-hub/ports'
import { configureAppPort, getAppRuntime } from '@/lib/dev-hub/process-manager'
import { getDevApp, localAppUrl } from '@/lib/dev-hub/registry'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireDevHubAuth()
  if (denied) return denied

  const { id } = await ctx.params
  if (!getDevApp(id)) {
    return NextResponse.json({ error: 'Unknown app' }, { status: 404 })
  }

  const runtime = getAppRuntime(id)
  if (runtime?.status === 'running' || runtime?.status === 'starting') {
    return NextResponse.json({ error: 'Stop the app before changing its port' }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))
  const port = typeof body.port === 'number' ? body.port : parseInt(String(body.port ?? ''), 10)
  if (!Number.isFinite(port)) {
    return NextResponse.json({ error: 'port must be a number' }, { status: 400 })
  }

  try {
    const updated = configureAppPort(id, clampPort(port))
    return NextResponse.json({
      runtime: updated,
      localUrl: localAppUrl(updated.port),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid port' },
      { status: 400 },
    )
  }
}
