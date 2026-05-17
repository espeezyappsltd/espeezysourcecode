import { NextResponse } from 'next/server'
import { assertDevEnvironment, isHubAuthenticated } from './auth'

export async function requireDevHubAuth(): Promise<NextResponse | null> {
  try {
    assertDevEnvironment()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Dev hub unavailable' },
      { status: 403 },
    )
  }
  if (!(await isHubAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
