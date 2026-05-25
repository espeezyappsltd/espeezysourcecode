import { NextRequest, NextResponse } from 'next/server'
import { leaveTeam } from '@/lib/team-waterfall'

export async function POST(req: NextRequest) {
  const { userId, teamId } = await req.json()
  if (!userId || !teamId) {
    return NextResponse.json({ error: 'Missing userId or teamId' }, { status: 400 })
  }
  try {
    await leaveTeam(userId, teamId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to leave team' }, { status: 500 })
  }
}
