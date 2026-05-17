import { NextResponse } from 'next/server'
import { requireDevHubAuth } from '@/lib/dev-hub/api'
import { startAllApps, stopAllApps } from '@/lib/dev-hub/process-manager'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const denied = await requireDevHubAuth()
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  const action = body.action === 'stop-all' ? 'stop-all' : 'start-all'

  const results = action === 'stop-all' ? stopAllApps() : startAllApps()
  return NextResponse.json({ action, results })
}
