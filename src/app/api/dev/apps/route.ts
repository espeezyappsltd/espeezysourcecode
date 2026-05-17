import { NextResponse } from 'next/server'
import { requireDevHubAuth } from '@/lib/dev-hub/api'
import { checkProdFleet, prodFleetMetrics } from '@/lib/dev-hub/prod-health'
import { checkAppHealth, getMetrics, listAppRuntimes } from '@/lib/dev-hub/process-manager'
import { DEV_APPS, localAppUrl } from '@/lib/dev-hub/registry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await requireDevHubAuth()
  if (denied) return denied

  const runtimes = listAppRuntimes()
  const health = await Promise.all(
    DEV_APPS.map(async (def) => {
      const runtime = runtimes.find((r) => r.appId === def.id)
      const healthy = runtime?.status === 'running' ? await checkAppHealth(def.id) : false
      return { appId: def.id, healthy }
    }),
  )
  const healthMap = Object.fromEntries(health.map((h) => [h.appId, h.healthy]))
  const prodFleet = await checkProdFleet()
  const prodStats = prodFleetMetrics(prodFleet)

  return NextResponse.json({
    metrics: { ...getMetrics(), ...prodStats },
    prodFleet,
    apps: DEV_APPS.map((def) => {
      const runtime = runtimes.find((r) => r.appId === def.id)
      return {
        ...def,
        localUrl: localAppUrl(def.port),
        runtime,
        healthy: healthMap[def.id] ?? false,
      }
    }),
  })
}
