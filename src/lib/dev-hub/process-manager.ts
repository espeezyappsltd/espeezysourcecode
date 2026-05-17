import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { DEV_APPS, getDevApp, localAppUrl, type DevAppDefinition } from './registry'

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
      apps.set(def.id, {
        appId: def.id,
        status: 'stopped',
        port: def.port,
        logs: [`[hub] Ready. Use Start to launch ${def.name} on port ${def.port}.`],
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

function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

function spawnDevApp(def: DevAppDefinition): ChildProcess {
  const cwd = path.join(repoRoot(), def.packagePath)
  // Run Next directly so hub-assigned ports win (package.json scripts often hard-code -p).
  const runner = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  return spawn(runner, ['next', 'dev', '-p', String(def.port)], {
    cwd,
    env: { ...process.env, FORCE_COLOR: '0', BROWSER: 'none' },
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
  const def = getDevApp(appId)
  if (!runtime || !def) return false
  try {
    const res = await fetch(localAppUrl(def.port), {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
    })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

export function startApp(appId: string): AppRuntime {
  const state = getState()
  const def = getDevApp(appId)
  if (!def) throw new Error(`Unknown app: ${appId}`)

  const existing = state.processes.get(appId)
  if (existing && !existing.killed) {
    const runtime = state.apps.get(appId)!
    runtime.status = 'running'
    return runtime
  }

  const runtime = state.apps.get(appId)!
  runtime.status = 'starting'
  runtime.startedAt = Date.now()
  runtime.lastError = undefined
  pushLog(runtime, `Starting ${def.name} → ${localAppUrl(def.port)}`)

  const child = spawnDevApp(def)
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
    if (code !== 0 && code !== null) {
      runtime.lastError = `Exited with code ${code}`
    }
    pushLog(runtime, `Process exited (code ${code ?? 'null'})`)
  })

  return runtime
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
  pushLog(runtime, 'Stopped by hub.')
  return runtime
}

export function restartApp(appId: string): AppRuntime {
  stopApp(appId)
  return startApp(appId)
}

export function getMetrics() {
  const runtimes = listAppRuntimes()
  const running = runtimes.filter((r) => r.status === 'running' || r.status === 'starting').length
  const errors = runtimes.filter((r) => r.status === 'error').length
  return {
    totalApps: DEV_APPS.length,
    running,
    stopped: runtimes.filter((r) => r.status === 'stopped').length,
    errors,
    hubPort: 3000,
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
