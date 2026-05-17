import { NextResponse } from 'next/server'
import { requireDevHubAuth } from '@/lib/dev-hub/api'
import { listTerminalEntries, runTerminalCommand } from '@/lib/dev-hub/process-manager'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await requireDevHubAuth()
  if (denied) return denied
  return NextResponse.json({ sessions: listTerminalEntries() })
}

export async function POST(req: Request) {
  const denied = await requireDevHubAuth()
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  const command = typeof body.command === 'string' ? body.command.trim() : ''
  const cwd = typeof body.cwd === 'string' ? body.cwd : undefined

  if (!command) {
    return NextResponse.json({ error: 'command is required' }, { status: 400 })
  }

  const blocked = ['rm -rf /', 'format c:', 'shutdown', 'reboot']
  if (blocked.some((b) => command.toLowerCase().includes(b))) {
    return NextResponse.json({ error: 'Command blocked for safety' }, { status: 400 })
  }

  const entry = runTerminalCommand(command, cwd)
  return NextResponse.json({ session: entry, sessions: listTerminalEntries() })
}
