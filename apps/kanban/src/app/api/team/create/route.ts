import { NextRequest, NextResponse } from 'next/server'
import { createOrSwitchTeam } from '@/lib/team-waterfall'

export async function POST(req: NextRequest) {
  const { userId, teamName } = await req.json()
  if (!userId || !teamName) {
    return NextResponse.json({ error: 'Missing userId or teamName' }, { status: 400 })
  }
  try {
    const team = await createOrSwitchTeam(userId, teamName)
    return NextResponse.json({ team })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create/switch team' }, { status: 500 })
  }
}
