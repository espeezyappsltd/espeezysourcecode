import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)

export type ProcessResource = {
  pid: number
  memoryMb: number | null
  cpuPercent: number | null
}

type CacheEntry = {
  at: number
  byPid: Map<number, ProcessResource>
}

const CACHE_MS = 4_000
let cache: CacheEntry | null = null

function parsePositiveInt(value: string): number | null {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

async function sampleUnix(pids: number[]): Promise<Map<number, ProcessResource>> {
  const out = new Map<number, ProcessResource>()
  if (pids.length === 0) return out

  try {
    const { stdout } = await exec('ps', ['-o', 'pid=,pcpu=,rss=', '-p', pids.join(',')], {
      timeout: 2_500,
      maxBuffer: 64 * 1024,
    })
    for (const line of stdout.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const parts = trimmed.split(/\s+/)
      if (parts.length < 3) continue
      const pid = parsePositiveInt(parts[0])
      if (!pid) continue
      const cpu = Number.parseFloat(parts[1])
      const rssKb = Number.parseFloat(parts[2])
      out.set(pid, {
        pid,
        cpuPercent: Number.isFinite(cpu) ? Math.round(cpu * 10) / 10 : null,
        memoryMb: Number.isFinite(rssKb) ? Math.round((rssKb / 1024) * 10) / 10 : null,
      })
    }
  } catch {
    // Process may have exited between listing and sample.
  }
  return out
}

async function sampleWindows(pids: number[]): Promise<Map<number, ProcessResource>> {
  const out = new Map<number, ProcessResource>()
  if (pids.length === 0) return out

  const idList = pids.join(',')
  const script = `Get-Process -Id ${idList} -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Id)|$([math]::Round($_.WorkingSet64/1MB,1))" }`

  try {
    const { stdout } = await exec(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { timeout: 4_000, maxBuffer: 64 * 1024 },
    )
    for (const line of stdout.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.includes('|')) continue
      const [pidRaw, memRaw] = trimmed.split('|')
      const pid = parsePositiveInt(pidRaw)
      const memoryMb = Number.parseFloat(memRaw)
      if (!pid) continue
      out.set(pid, {
        pid,
        memoryMb: Number.isFinite(memoryMb) ? memoryMb : null,
        cpuPercent: null,
      })
    }
  } catch {
    // Ignore sampling errors — UI shows em dash.
  }
  return out
}

/** Batch sample CPU/RAM for child PIDs (cached ~4s to keep the hub light). */
export async function sampleProcessResources(pids: number[]): Promise<Map<number, ProcessResource>> {
  const unique = [...new Set(pids.filter((p) => p > 0))]
  if (unique.length === 0) return new Map()

  const now = Date.now()
  if (cache && now - cache.at < CACHE_MS) {
    const hit = new Map<number, ProcessResource>()
    for (const pid of unique) {
      const row = cache.byPid.get(pid)
      if (row) hit.set(pid, row)
    }
    if (hit.size === unique.length) return hit
  }

  const sampled =
    process.platform === 'win32' ? await sampleWindows(unique) : await sampleUnix(unique)

  cache = {
    at: now,
    byPid: new Map([...(cache?.byPid.entries() ?? []), ...sampled.entries()]),
  }

  return sampled
}

/** Hub process footprint (no shell — essentially free). */
export function getHubProcessResource(): ProcessResource {
  const mem = process.memoryUsage()
  return {
    pid: process.pid,
    memoryMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
    cpuPercent: null,
  }
}
