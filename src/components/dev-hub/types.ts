export type AppRuntimeStatus = 'stopped' | 'starting' | 'running' | 'error'

export type AppRuntime = {
  appId: string
  status: AppRuntimeStatus
  port: number
  pid?: number
  startedAt?: number
  logs: string[]
  lastError?: string
}

export type DevAppRow = {
  id: string
  name: string
  description: string
  packagePath: string
  port: number
  defaultPort: number
  portCustom?: boolean
  localHost: string
  productionUrl?: string
  accent: string
  localUrl: string
  runtime?: AppRuntime
  healthy: boolean
}

export type HubMetrics = {
  totalApps: number
  running: number
  stopped: number
  errors: number
  hubPort: number
  prodTotal?: number
  prodOnline?: number
  prodOffline?: number
  avgLatencyMs?: number | null
}

export type ProdFleetRow = {
  id: string
  appId: string
  name: string
  hostname: string
  url: string
  registerUrl?: string
  tagline: string
  accent: string
  online: boolean
  statusCode: number | null
  latencyMs: number | null
  checkedAt: number
}

export type TerminalEntry = {
  id: string
  command: string
  cwd: string
  startedAt: number
  status: 'running' | 'done' | 'error'
  logs: string[]
  exitCode?: number | null
}
