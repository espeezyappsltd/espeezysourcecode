import { NextResponse } from 'next/server'
import { requireDevHubAuth } from '@/lib/dev-hub/api'
import { getAppRuntime, startAppDebug } from '@/lib/dev-hub/process-manager'
import { getDevApp } from '@/lib/dev-hub/registry'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireDevHubAuth()
  if (denied) return denied

  const { id } = await ctx.params
  const def = getDevApp(id)
  if (!def) {
    return NextResponse.json({ error: 'Unknown app' }, { status: 404 })
  }
  if (!def.inspectPort) {
    return NextResponse.json({ error: 'Debug not configured for this app' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const port =
    typeof body.port === 'number'
      ? body.port
      : body.port != null
        ? Number.parseInt(String(body.port), 10)
        : undefined

  const runtime = startAppDebug(id, Number.isFinite(port) ? port : undefined)
  return NextResponse.json({
    runtime: getAppRuntime(id) ?? runtime,
    inspectUrl: `devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=127.0.0.1:${def.inspectPort}`,
    vscodeUrl: `vscode://vscode-debugger?url=http://127.0.0.1:${def.inspectPort}`,
  })
}
