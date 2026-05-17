import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { getEffectivePort, localAppUrl, setAppPort } from './ports'
import { getHubProcessResource, sampleProcessResources, type ProcessResource } from './resource-metrics'
import { DEV_APPS, getDevApp, hubListenPort, type DevAppDefinition } from './registry'

export type AppRuntimeStatus = 'stopped' | 'starting' | 'running' | 'error'
export type AppRunMode = 'dev' | 'debug'

export type AppRuntime = {
  appId: string
  status: AppRuntimeStatus
  port: number
  pid?: number
  startedAt?: number
  mode?: AppRunMode
  inspectPort?: number
  logs: string[]
  lastError?: string
  resources?: ProcessResource
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

const MAX_LOG_LINES = 800

type ManagerState = {
  apps: Map<string, AppRuntime>
  processes: Map<string, ChildProcess>
  terminal: TerminalEntry[]
  terminalCounter: number
  hubResource?: ProcessResource
}

declare global {
  // eslint-disable-next-line no-var
  var __espeezyDevHub: ManagerState | undefined
}

function repoRoot(): string {
  return process.cwd()
}

function getState(): ManagerState {
  if (!global.__espeezyDevHub) {
    const apps = new Map<string, AppRuntime>()
    for (const def of DEV_APPS) {
      const port = getEffectivePort(def.id)
      apps.set(def.id, {
        appId: def.id,
        status: 'stopped',
        port,
        logs: [`[hub] Ready. Use Start to launch ${def.name} at ${localAppUrl(port)}.`],
      })
    }
    global.__espeezyDevHub = {
      apps,
      processes: new Map(),
      terminal: [],
      terminalCounter: 0,
    }
  }
  return global.__espeezyDevHub
}

function pushLog(runtime: AppRuntime, line: string) {
  const stamped = `[${new Date().toLocaleTimeString()}] ${line}`
  runtime.logs.push(stamped)
  if (runtime.logs.length > MAX_LOG_LINES) {
    runtime.logs.splice(0, runtime.logs.length - MAX_LOG_LINES)
  }
}

function pushTerminalLog(entry: TerminalEntry, line: string) {
  const stamped = `[${new Date().toLocaleTimeString()}] ${line}`
  entry.logs.push(stamped)
  if (entry.logs.length > MAX_LOG_LINES) {
    entry.logs.splice(0, entry.logs.length - MAX_LOG_LINES)
  }
}

export type StartAppOptions = {
  port?: number
  debug?: boolean
}

function spawnDevApp(def: DevAppDefinition, port: number, options?: StartAppOptions): ChildProcess {
  const cwd = path.join(repoRoot(), def.packagePath)
  const runner = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const env: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: '0', BROWSER: 'none' }

  if (options?.debug && def.inspectPort) {
    env.NODE_OPTIONS = `--inspect=127.0.0.1:${def.inspectPort}`
  }

  return spawn(runner, ['next', 'dev', '-p', String(port)], {
    cwd,
    env,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

export function listAppRuntimes(): AppRuntime[] {
  return Array.from(getState().apps.values())
}

export function getAppRuntime(appId: string): AppRuntime | undefined {
  return getState().apps.get(appId)
}

export async function checkAppHealth(appId: string): Promise<boolean> {
  const runtime = getState().apps.get(appId)
  if (!runtime) return false
  const def = getDevApp(appId)
  const path = def?.healthPath ?? def?.previewPath ?? '/'
  const url = `${localAppUrl(runtime.port)}${path.startsWith('/') ? path : `/${path}`}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

export function configureAppPort(appId: string, port: number): AppRuntime {
  const def = getDevApp(appId)
  if (!def) throw new Error(`Unknown app: ${appId}`)
  const state = getState()
  const runtime = state.apps.get(appId)
  if (!runtime) throw new Error(`Unknown app: ${appId}`)

  const nextPort = setAppPort(appId, port)
  runtime.port = nextPort
  pushLog(runtime, `Port set to ${nextPort} (${localAppUrl(nextPort)})`)
  return runtime
}

export function startApp(appId: string, port?: number, options?: StartAppOptions): AppRuntime {
  const state = getState()
  const def = getDevApp(appId)
  if (!def) throw new Error(`Unknown app: ${appId}`)

  const existing = state.processes.get(appId)
  if (existing && !existing.killed) {
    const runtime = state.apps.get(appId)!
    runtime.status = 'running'
    return runtime
  }

  if (port != null) configureAppPort(appId, port)

  const effectivePort = getEffectivePort(appId)
  const runtime = state.apps.get(appId)!
  const debug = Boolean(options?.debug && def.inspectPort)
  runtime.port = effectivePort
  runtime.status = 'starting'
  runtime.startedAt = Date.now()
  runtime.lastError = undefined
  runtime.mode = debug ? 'debug' : 'dev'
  runtime.inspectPort = debug ? def.inspectPort : undefined
  runtime.resources = undefined

  const modeLabel = debug ? `debug :${def.inspectPort}` : 'dev'
  pushLog(runtime, `Starting ${def.name} (${modeLabel}) → ${localAppUrl(effectivePort)}`)

  const child = spawnDevApp(def, effectivePort, options)
  state.processes.set(appId, child)
  runtime.pid = child.pid

  child.stdout?.on('data', (buf) => {
    const text = buf.toString()
    text.split(/\r?\n/).filter(Boolean).forEach((l: string) => pushLog(runtime, l))
    runtime.status = 'running'
  })
  child.stderr?.on('data', (buf) => {
    const text = buf.toString()
    text.split(/\r?\n/).filter(Boolean).forEach((l: string) => pushLog(runtime, `[stderr] ${l}`))
  })
  child.on('error', (err) => {
    runtime.status = 'error'
    runtime.lastError = err.message
    pushLog(runtime, `Process error: ${err.message}`)
  })
  child.on('exit', (code) => {
    state.processes.delete(appId)
    runtime.status = code === 0 ? 'stopped' : 'error'
    runtime.mode = undefined
    runtime.inspectPort = undefined
    runtime.resources = undefined
    if (code !== 0 && code !== null) {
      runtime.lastError = `Exited with code ${code}`
    }
    pushLog(runtime, `Process exited (code ${code ?? 'null'})`)
  })

  return runtime
}

export function startAppDebug(appId: string, port?: number): AppRuntime {
  return startApp(appId, port, { debug: true })
}

export function stopApp(appId: string): AppRuntime {
  const state = getState()
  const runtime = state.apps.get(appId)
  if (!runtime) throw new Error(`Unknown app: ${appId}`)

  const child = state.processes.get(appId)
  if (child && !child.killed) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { shell: true })
    } else {
      child.kill('SIGTERM')
    }
    state.processes.delete(appId)
  }

  runtime.status = 'stopped'
  runtime.pid = undefined
  runtime.mode = undefined
  runtime.inspectPort = undefined
  runtime.resources = undefined
  pushLog(runtime, 'Stopped by hub.')
  return runtime
}

export function restartApp(appId: string, port?: number, options?: StartAppOptions): AppRuntime {
  const runtime = getState().apps.get(appId)
  const mode = options ?? (runtime?.mode === 'debug' ? { debug: true } : undefined)
  stopApp(appId)
  return startApp(appId, port, mode)
}

export type BatchResult = { appId: string; status: AppRuntimeStatus; error?: string }

export function startAllApps(): BatchResult[] {
  return DEV_APPS.map((def) => {
    try {
      const runtime = startApp(def.id)
      return { appId: def.id, status: runtime.status }
    } catch (err) {
      return {
        appId: def.id,
        status: 'error' as const,
        error: err instanceof Error ? err.message : 'Start failed',
      }
    }
  })
}

export function stopAllApps(): BatchResult[] {
  return DEV_APPS.map((def) => {
    try {
      const runtime = stopApp(def.id)
      return { appId: def.id, status: runtime.status }
    } catch (err) {
      return {
        appId: def.id,
        status: 'error' as const,
        error: err instanceof Error ? err.message : 'Stop failed',
      }
    }
  })
}

export async function attachResourceMetrics(): Promise<void> {
  const active = listAppRuntimes().filter(
    (r) => (r.status === 'running' || r.status === 'starting') && r.pid,
  )
  const pids = active.map((r) => r.pid!)
  const sampled = await sampleProcessResources(pids)

  for (const runtime of active) {
    runtime.resources = runtime.pid ? sampled.get(runtime.pid) : undefined
  }

  getState().hubResource = getHubProcessResource()
}

export function getHubResource(): ProcessResource {
  return getState().hubResource ?? getHubProcessResource()
}

export function getMetrics() {
  const runtimes = listAppRuntimes()
  const running = runtimes.filter((r) => r.status === 'running' || r.status === 'starting').length
  const errors = runtimes.filter((r) => r.status === 'error').length
  const totalMemoryMb = runtimes.reduce((sum, r) => sum + (r.resources?.memoryMb ?? 0), 0)
  const cpuValues = runtimes
    .map((r) => r.resources?.cpuPercent)
    .filter((v): v is number => v != null)
  const hub = getHubResource()

  return {
    totalApps: DEV_APPS.length,
    running,
    stopped: runtimes.filter((r) => r.status === 'stopped').length,
    errors,
    hubPort: hubListenPort(),
    totalMemoryMb: Math.round((totalMemoryMb + (hub.memoryMb ?? 0)) * 10) / 10,
    avgCpuPercent:
      cpuValues.length > 0
        ? Math.round((cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) * 10) / 10
        : null,
    hubMemoryMb: hub.memoryMb,
  }
}

export function runTerminalCommand(command: string, cwd?: string): TerminalEntry {
  const state = getState()
  const workdir = cwd ? path.resolve(repoRoot(), cwd) : repoRoot()
  const id = `term-${++state.terminalCounter}`
  const entry: TerminalEntry = {
    id,
    command,
    cwd: workdir,
    startedAt: Date.now(),
    status: 'running',
    logs: [`$ ${command}`, `(cwd: ${workdir})`],
  }
  state.terminal.unshift(entry)
  if (state.terminal.length > 30) state.terminal.pop()

  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
  const shellArgs =
    process.platform === 'win32' ? ['-NoProfile', '-Command', command] : ['-lc', command]

  const child = spawn(shell, shellArgs, {
    cwd: workdir,
    env: process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout?.on('data', (buf) => {
    buf.toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((l: string) => pushTerminalLog(entry, l))
  })
  child.stderr?.on('data', (buf) => {
    buf.toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((l: string) => pushTerminalLog(entry, `[stderr] ${l}`))
  })
  child.on('error', (err) => {
    entry.status = 'error'
    pushTerminalLog(entry, `Error: ${err.message}`)
  })
  child.on('exit', (code) => {
    entry.exitCode = code
    entry.status = code === 0 ? 'done' : 'error'
    pushTerminalLog(entry, `Exit code: ${code ?? 'null'}`)
  })

  return entry
}

export function listTerminalEntries(): TerminalEntry[] {
  return getState().terminal
}
