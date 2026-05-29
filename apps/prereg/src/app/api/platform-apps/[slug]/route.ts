import { NextResponse } from 'next/server'
import { fetchPlatformAppBySlug } from '@/lib/platform-apps-db'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 })
  }

  try {
    const app = await fetchPlatformAppBySlug(normalized)
    if (!app) {
      return NextResponse.json({ error: 'App not found.' }, { status: 404 })
    }
    return NextResponse.json({ app })
  } catch (error) {
    console.error('[platform-apps/[slug]] GET error:', error)
    return NextResponse.json({ error: 'Failed to load app.' }, { status: 500 })
  }
}
