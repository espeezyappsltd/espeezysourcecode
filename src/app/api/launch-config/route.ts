import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getAdminDb()
    if (!db) {
      throw new Error('Database not initialized')
    }

    const keys = ['launch_date', 'launch_message', 'preregister_goal', 'preregister_open', 'brand_name', 'platform_version']
    const config: Record<string, any> = {}

    const snapshots = await Promise.all(
      keys.map(key => db.collection('app_config').doc(key).get())
    )

    snapshots.forEach((doc, index) => {
      if (doc.exists) {
        config[keys[index]] = doc.data()?.value
      }
    })

    return NextResponse.json({ config }, {
      headers: {
        // App config is rarely updated — cache at CDN for 5 min, stale for 1 min
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[launch-config] GET error:', err)
    return NextResponse.json({ config: {} })
  }
}
