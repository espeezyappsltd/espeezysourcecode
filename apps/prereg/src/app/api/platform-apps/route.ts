import { NextResponse } from 'next/server'
import { fetchPublishedPlatformApps } from '@/lib/platform-apps-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const apps = await fetchPublishedPlatformApps()
    return NextResponse.json({ apps })
  } catch (error) {
    console.error('[platform-apps] GET error:', error)
    return NextResponse.json({ error: 'Failed to load apps catalog.' }, { status: 500 })
  }
}
