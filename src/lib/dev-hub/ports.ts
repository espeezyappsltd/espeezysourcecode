import { getDevApp } from './registry'

const MIN_PORT = 1024
const MAX_PORT = 65535

type PortState = {
  overrides: Map<string, number>
}

declare global {
  // eslint-disable-next-line no-var
  var __espeezyDevHubPorts: PortState | undefined
}

function portState(): PortState {
  if (!global.__espeezyDevHubPorts) {
    global.__espeezyDevHubPorts = { overrides: new Map() }
  }
  return global.__espeezyDevHubPorts
}

/** Local hostname for dev URLs (default localhost). Set DEV_HUB_HOST to override. */
export function localDevHost(): string {
  const raw = process.env.DEV_HUB_HOST?.trim() || 'localhost'
  return raw.replace(/^https?:\/\//i, '').split('/')[0]?.split(':')[0] || 'localhost'
}

export function localAppUrl(port: number): string {
  return `http://${localDevHost()}:${port}`
}

export function hubListenPort(): number {
  const raw = process.env.DEV_HUB_PORT ?? process.env.PORT ?? '3000'
  const n = parseInt(String(raw), 10)
  return clampPort(Number.isFinite(n) ? n : 3000)
}

function envPortForApp(appId: string): number | undefined {
  const key = `DEV_HUB_PORT_${appId.toUpperCase().replace(/-/g, '_')}`
  const raw = process.env[key]
  if (!raw) return undefined
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? clampPort(n) : undefined
}

export function clampPort(port: number): number {
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`Port must be an integer between ${MIN_PORT} and ${MAX_PORT}`)
  }
  return port
}

export function defaultPortForApp(appId: string): number {
  return getDevApp(appId)?.port ?? 0
}

export function getEffectivePort(appId: string): number {
  const override = portState().overrides.get(appId)
  if (override != null) return override
  const fromEnv = envPortForApp(appId)
  if (fromEnv != null) return fromEnv
  return defaultPortForApp(appId)
}

export function setAppPort(appId: string, port: number): number {
  const next = clampPort(port)
  portState().overrides.set(appId, next)
  return next
}

export function clearAppPort(appId: string): number {
  portState().overrides.delete(appId)
  return getEffectivePort(appId)
}

export function isPortOverridden(appId: string): boolean {
  return portState().overrides.has(appId) || envPortForApp(appId) != null
}

export function listPortOverrides(): Record<string, number> {
  return Object.fromEntries(portState().overrides.entries())
}
