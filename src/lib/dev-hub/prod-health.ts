import { PROD_DEPLOYMENTS, type ProdDeployment } from './prod-registry'

export type ProdHealthResult = ProdDeployment & {
  online: boolean
  statusCode: number | null
  latencyMs: number | null
  checkedAt: number
}

const PROD_CACHE_MS = 45_000
let prodCache: { at: number; fleet: ProdHealthResult[] } | null = null

async function probeUrl(url: string): Promise<{ online: boolean; statusCode: number | null; latencyMs: number }> {
  const start = Date.now()
  const init: RequestInit = {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Espeezy-DevHub/1.0' },
  }

  try {
    const res = await fetch(url, init)
    const latencyMs = Date.now() - start
    const online = res.ok || (res.status >= 200 && res.status < 500)
    return { online, statusCode: res.status, latencyMs }
  } catch {
    try {
      const start2 = Date.now()
      const res = await fetch(url, { ...init, method: 'HEAD' })
      const latencyMs = Date.now() - start2
      return {
        online: res.ok || res.status < 500,
        statusCode: res.status,
        latencyMs,
      }
    } catch {
      return { online: false, statusCode: null, latencyMs: Date.now() - start }
    }
  }
}

export async function checkProdFleet(force = false): Promise<ProdHealthResult[]> {
  const now = Date.now()
  if (!force && prodCache && now - prodCache.at < PROD_CACHE_MS) {
    return prodCache.fleet
  }

  const checkedAt = now
  const results = await Promise.all(
    PROD_DEPLOYMENTS.map(async (dep) => {
      const probe = await probeUrl(dep.url)
      return {
        ...dep,
        online: probe.online,
        statusCode: probe.statusCode,
        latencyMs: probe.latencyMs,
        checkedAt,
      }
    }),
  )
  prodCache = { at: now, fleet: results }
  return results
}

export function prodFleetMetrics(fleet: ProdHealthResult[]) {
  const online = fleet.filter((f) => f.online).length
  return {
    prodTotal: fleet.length,
    prodOnline: online,
    prodOffline: fleet.length - online,
    avgLatencyMs:
      fleet.filter((f) => f.online && f.latencyMs != null).length > 0
        ? Math.round(
            fleet
              .filter((f) => f.online && f.latencyMs != null)
              .reduce((sum, f) => sum + (f.latencyMs ?? 0), 0) /
              fleet.filter((f) => f.online && f.latencyMs != null).length,
          )
        : null,
  }
}
