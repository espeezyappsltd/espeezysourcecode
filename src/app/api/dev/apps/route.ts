import { NextResponse } from 'next/server'
import { requireDevHubAuth } from '@/lib/dev-hub/api'
import { checkProdFleet, prodFleetMetrics } from '@/lib/dev-hub/prod-health'
import { attachResourceMetrics, checkAppHealth, getHubResource, getMetrics, listAppRuntimes } from '@/lib/dev-hub/process-manager'
import { defaultPortForApp, getEffectivePort, isPortOverridden, localAppUrl, localDevHost } from '@/lib/dev-hub/ports'
import { DEV_APPS } from '@/lib/dev-hub/registry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await requireDevHubAuth()
  if (denied) return denied

  const runtimes = listAppRuntimes()
  const hasRunning = runtimes.some((r) => r.status === 'running' || r.status === 'starting')
  if (hasRunning) {
    await attachResourceMetrics()
  }

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
    hubResource: getHubResource(),
    prodFleet,
    localHost: localDevHost(),
    apps: DEV_APPS.map((def) => {
      const runtime = runtimes.find((r) => r.appId === def.id)
      const port = runtime?.port ?? getEffectivePort(def.id)
      if (runtime && runtime.status === 'stopped') {
        runtime.port = port
      }
      return {
        ...def,
        port,
        defaultPort: defaultPortForApp(def.id),
        portCustom: isPortOverridden(def.id),
        localHost: localDevHost(),
        localUrl: `${localAppUrl(port)}${def.previewPath ?? ''}`,
        runtime,
        healthy: healthMap[def.id] ?? false,
      }
    }),
  })
}
