import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getAdminDb()
    const keys = ['launch_date', 'launch_message', 'preregister_goal', 'preregister_open', 'brand_name', 'platform_version']
    const config: Record<string, string | number | boolean | null> = {}

    const { data, error } = await db
      .from('app_config')
      .select('key, value')
      .in('key', keys)

    if (error) {
      throw error
    }

    for (const row of data ?? []) {
      config[row.key] = row.value as string | number | boolean | null
    }

    return NextResponse.json({ config }, {
      headers: {
        // App config is rarely updated  -  cache at CDN for 5 min, stale for 1 min
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err: unknown) {
    console.error('[launch-config] GET error:', err instanceof Error ? err.message : 'unknown error')
    return NextResponse.json({ config: {} })
  }
}
