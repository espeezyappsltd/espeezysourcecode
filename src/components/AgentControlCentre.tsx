'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot, Plus, Trash2, Play, Pause, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, Circle, Clock, AlertCircle, Zap, Server, Layout,
  ArrowRight, X, Save, RotateCcw, Terminal, Send
} from 'lucide-react'

type AgentStatus = 'active' | 'paused' | 'training'
type AgentSpec = 'frontend' | 'backend' | 'devops'
type AgentRole = 'builder' | 'validator'
type TaskStatus = 'not_started' | 'in_progress' | 'review' | 'done' | 'blocked'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

interface Agent {
  id: string
  name: string
  specialisation: AgentSpec
  role: AgentRole
  status: AgentStatus
  capabilities: string[]
  tasks_completed: number
  system_prompt?: string
  pair?: { id: string; name: string } | null
}

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigned_agent_id?: string
  agent?: { id: string; name: string; specialisation: string } | null
  created_at: string
  started_at?: string
  completed_at?: string
  output_artifacts?: unknown[]
  logs?: string
}

const SPEC_ICON: Record<AgentSpec, typeof Bot> = { frontend: Layout, backend: Server, devops: Zap }
const SPEC_COLOR: Record<AgentSpec, string> = {
  frontend: '#3B82F6',
  backend: '#10B981',
  devops: '#F59E0B',
}
const STATUS_COLOR: Record<AgentStatus, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  training: '#3B82F6',
}
const TASK_STATUS_ICON: Record<TaskStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: Clock,
  review: RefreshCw,
  done: CheckCircle2,
  blocked: AlertCircle,
}
const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  not_started: 'rgba(255,255,255,0.3)',
  in_progress: '#3B82F6',
  review: '#F59E0B',
  done: '#10B981',
  blocked: '#EF4444',
}
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'rgba(255,255,255,0.3)',
  medium: '#3B82F6',
  high: '#F59E0B',
  critical: '#EF4444',
}

const TASK_COLUMNS: TaskStatus[] = ['not_started', 'in_progress', 'review', 'done', 'blocked']

export default function AgentControlCentre() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'agents' | 'board' | 'new-agent' | 'new-task' | 'orchestrate'>('agents')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  // New agent form
  const [newAgent, setNewAgent] = useState({
    name: '', specialisation: 'frontend' as AgentSpec, role: 'builder' as AgentRole,
    system_prompt: '', capabilities: ''
  })

  // New task form
  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'medium' as TaskPriority, assigned_agent_id: ''
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Orchestrate command
  const [orchestrateCmd, setOrchestrateCmd] = useState('')
  const [orchestrating, setOrchestrating] = useState(false)
  const [orchestrateResult, setOrchestrateResult] = useState<{ tasks_created: number; plan: { task_id: string; title: string; agent: string }[] } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [agentsRes, tasksRes] = await Promise.all([
        fetch('/api/admin/agents'),
        fetch('/api/admin/tasks'),
      ])
      if (agentsRes.status === 401) { router.push('/admin'); return }
      const { agents: a } = await agentsRes.json()
      const { tasks: t } = await tasksRes.json()
      setAgents(a ?? [])
      setTasks(t ?? [])
    } finally {
      setLoading(false)
    }
  }, [router])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function toggleAgentStatus(agent: Agent) {
    const next = agent.status === 'active' ? 'paused' : 'active'
    await fetch(`/api/admin/agents/${agent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: next } : a))
  }

  async function deleteAgent(id: string) {
    if (!confirm('Delete this agent? This cannot be undone.')) return
    await fetch(`/api/admin/agents/${id}`, { method: 'DELETE' })
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function retryTask(task: Task) {
    await fetch(`/api/admin/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'not_started' }),
    })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'not_started' } : t))
  }

  async function submitOrchestrateCmd() {
    if (orchestrateCmd.trim().length < 10) {
      setError('Command must be at least 10 characters so agents have enough detail to work with')
      return
    }
    setOrchestrating(true); setError(''); setOrchestrateResult(null)
    try {
      const res = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: orchestrateCmd }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create tasks. Please refine your command and try again.'); return }
      setOrchestrateResult(data)
      setOrchestrateCmd('')
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error: unable to reach the orchestration service. Please check your connection and try again.')
    } finally {
      setOrchestrating(false)
    }
  }

  async function moveTask(task: Task, status: TaskStatus) {
    await fetch(`/api/admin/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t))
  }

  async function createAgent() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAgent,
          capabilities: newAgent.capabilities.split(',').map(c => c.trim()).filter(Boolean)
        }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      await load()
      setView('agents')
      setNewAgent({ name: '', specialisation: 'frontend', role: 'builder', system_prompt: '', capabilities: '' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  async function createTask() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          assigned_agent_id: newTask.assigned_agent_id || null,
        }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      await load()
      setView('board')
      setNewTask({ title: '', description: '', priority: 'medium', assigned_agent_id: '' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const bySpec = (spec: AgentSpec) => agents.filter(a => a.specialisation === spec)

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
        Loading agent network...
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bot size={22} color="#10B981" />
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#F3F4F6' }}>
            AGENT CONTROL CENTRE
          </h2>
          <span style={{ background: '#10B98130', border: '1px solid #10B98150', borderRadius: '4px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.12em', color: '#10B981', textTransform: 'uppercase' }}>
            {agents.filter(a => a.status === 'active').length} ACTIVE
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['agents', 'board', 'orchestrate'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid',
              borderColor: view === v ? '#10B981' : 'rgba(255,255,255,0.1)',
              background: view === v ? '#10B98120' : 'transparent',
              color: view === v ? '#10B981' : 'rgba(255,255,255,0.55)',
              fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
              {v === 'agents' ? 'Agents' : v === 'board' ? 'Task Board' : 'Orchestrate'}
            </button>
          ))}
          <button onClick={() => { setView('new-task'); setError('') }} style={{
            padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.55)',
            fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em',
            textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <Plus size={12} /> Task
          </button>
          <button onClick={() => { setView('new-agent'); setError('') }} style={{
            padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #10B981',
            background: '#10B98120', color: '#10B981',
            fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em',
            textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <Plus size={12} /> Agent
          </button>
          <button onClick={load} style={{
            padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: '#EF444420', border: '1px solid #EF4444', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#EF4444', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* AGENTS VIEW */}
      {view === 'agents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {(['frontend', 'backend', 'devops'] as AgentSpec[]).map(spec => {
            const Icon = SPEC_ICON[spec]
            const color = SPEC_COLOR[spec]
            return (
              <div key={spec}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color }}>
                    {spec} pair
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {bySpec(spec).map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      taskCount={tasks.filter(t => t.assigned_agent_id === agent.id && t.status !== 'done').length}
                      expanded={expandedAgent === agent.id}
                      onExpand={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                      onToggle={() => toggleAgentStatus(agent)}
                      onDelete={() => deleteAgent(agent.id)}
                    />
                  ))}
                  {bySpec(spec).length === 0 && (
                    <div style={{ padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', textAlign: 'center' }}>
                      No {spec} agents
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TASK BOARD VIEW */}
      {view === 'board' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))', gap: '1rem', minWidth: '1050px' }}>
            {TASK_COLUMNS.map(col => (
              <div key={col}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {(() => { const I = TASK_STATUS_ICON[col]; return <I size={13} color={TASK_STATUS_COLOR[col]} /> })()}
                  <span style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: TASK_STATUS_COLOR[col] }}>
                    {col.replace('_', ' ')}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                    {tasks.filter(t => t.status === col).length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tasks.filter(t => t.status === col).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      expanded={expandedTask === task.id}
                      onExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      onMove={moveTask}
                      onRetry={retryTask}
                      onDelete={deleteTask}
                    />
                  ))}
                  {tasks.filter(t => t.status === col).length === 0 && (
                    <div style={{ padding: '1.5rem 1rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '8px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORCHESTRATE VIEW */}
      {view === 'orchestrate' && (
        <div style={{ maxWidth: '640px' }}>
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Terminal size={16} color="#10B981" />
              <h3 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1rem' }}>Orchestrate Command</h3>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>
              Describe what needs to be built. The orchestrator will decompose your command into tasks and assign them to the right agents.
            </p>
            <textarea
              value={orchestrateCmd}
              onChange={e => setOrchestrateCmd(e.target.value)}
              rows={4}
              placeholder="e.g. Build a new API route and UI page for user notifications with database migration and Playwright tests"
              style={{ ...inputStyle, resize: 'vertical', marginBottom: '0.75rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: orchestrateCmd.trim().length < 10 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>
                {orchestrateCmd.trim().length} / 2000 chars (min 10)
              </span>
              <button
                onClick={submitOrchestrateCmd}
                disabled={orchestrating || orchestrateCmd.trim().length < 10}
                style={{
                  padding: '0.55rem 1.25rem', background: '#10B981', border: 'none', borderRadius: '8px',
                  color: '#000', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.06em',
                  textTransform: 'uppercase', cursor: (orchestrating || orchestrateCmd.trim().length < 10) ? 'not-allowed' : 'pointer',
                  opacity: (orchestrating || orchestrateCmd.trim().length < 10) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <Send size={13} /> {orchestrating ? 'Dispatching...' : 'Dispatch'}
              </button>
            </div>
          </div>

          {orchestrateResult && (
            <div style={{ background: '#0d1a12', border: '1px solid #10B98140', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#10B981' }}>
                  {orchestrateResult.tasks_created} task{orchestrateResult.tasks_created !== 1 ? 's' : ''} created
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {orchestrateResult.plan.map((t, i) => (
                  <div key={t.task_id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', minWidth: '1.2rem' }}>{i + 1}.</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{t.agent}</span>
                    <span style={{ color: '#E5E7EB' }}>{t.title}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setOrchestrateResult(null); setView('board') }}
                style={{ marginTop: '1rem', padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowRight size={11} /> View Task Board
              </button>
            </div>
          )}
        </div>
      )}

      {/* NEW AGENT FORM */}
      {view === 'new-agent' && (
        <div style={{ maxWidth: '540px', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1rem' }}>Register New Agent</h3>
            <button onClick={() => setView('agents')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <FormField label="Name">
            <input value={newAgent.name} onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Eta" style={inputStyle} />
          </FormField>
          <FormField label="Specialisation">
            <select value={newAgent.specialisation} onChange={e => setNewAgent(p => ({ ...p, specialisation: e.target.value as AgentSpec }))} style={inputStyle}>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="devops">DevOps</option>
            </select>
          </FormField>
          <FormField label="Role">
            <select value={newAgent.role} onChange={e => setNewAgent(p => ({ ...p, role: e.target.value as AgentRole }))} style={inputStyle}>
              <option value="builder">Builder</option>
              <option value="validator">Validator</option>
            </select>
          </FormField>
          <FormField label="Capabilities (comma-separated)">
            <input value={newAgent.capabilities} onChange={e => setNewAgent(p => ({ ...p, capabilities: e.target.value }))} placeholder="React, TypeScript, Tailwind" style={inputStyle} />
          </FormField>
          <FormField label="System Prompt">
            <textarea value={newAgent.system_prompt} onChange={e => setNewAgent(p => ({ ...p, system_prompt: e.target.value }))} rows={4} placeholder="You are..." style={{ ...inputStyle, resize: 'vertical' }} />
          </FormField>
          <button onClick={createAgent} disabled={saving || !newAgent.name} style={{
            width: '100%', padding: '0.75rem', background: '#10B981', border: 'none', borderRadius: '8px',
            color: '#000', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.06em',
            textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem',
          }}>
            <Save size={14} /> {saving ? 'Registering...' : 'Register Agent'}
          </button>
        </div>
      )}

      {/* NEW TASK FORM */}
      {view === 'new-task' && (
        <div style={{ maxWidth: '540px', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1rem' }}>Create New Task</h3>
            <button onClick={() => setView('board')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <FormField label="Title">
            <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title" style={inputStyle} />
          </FormField>
          <FormField label="Description">
            <textarea value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What needs to be done?" style={{ ...inputStyle, resize: 'vertical' }} />
          </FormField>
          <FormField label="Priority">
            <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as TaskPriority }))} style={inputStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </FormField>
          <FormField label="Assign to Agent">
            <select value={newTask.assigned_agent_id} onChange={e => setNewTask(p => ({ ...p, assigned_agent_id: e.target.value }))} style={inputStyle}>
              <option value="">— Unassigned —</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.specialisation} / {a.role})</option>
              ))}
            </select>
          </FormField>
          <button onClick={createTask} disabled={saving || !newTask.title} style={{
            width: '100%', padding: '0.75rem', background: '#10B981', border: 'none', borderRadius: '8px',
            color: '#000', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.06em',
            textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem',
          }}>
            <Plus size={14} /> {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentCard({ agent, taskCount, expanded, onExpand, onToggle, onDelete }: {
  agent: Agent; taskCount: number; expanded: boolean
  onExpand: () => void; onToggle: () => void; onDelete: () => void
}) {
  const Icon = SPEC_ICON[agent.specialisation]
  const color = SPEC_COLOR[agent.specialisation]
  return (
    <div style={{ background: '#111', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#F3F4F6' }}>{agent.name}</span>
            <span style={{ background: `${STATUS_COLOR[agent.status]}20`, color: STATUS_COLOR[agent.status], fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.1em', padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
              {agent.status}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
              {agent.role}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
            {taskCount} active task{taskCount !== 1 ? 's' : ''} · {agent.tasks_completed} completed
          </div>
        </div>
        <button onClick={onExpand} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {expanded && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {agent.capabilities?.length > 0 && (
            <div style={{ paddingTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
              {agent.capabilities.map(c => (
                <span key={c} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px 7px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  {c}
                </span>
              ))}
            </div>
          )}
          {agent.pair && (
            <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>
              Paired with: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{agent.pair.name}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onToggle} style={{
              flex: 1, padding: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px', color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}>
              {agent.status === 'active' ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Resume</>}
            </button>
            <button onClick={onDelete} style={{
              padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '6px', color: '#EF4444', cursor: 'pointer',
            }}>
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, expanded, onExpand, onMove, onRetry, onDelete }: {
  task: Task; expanded: boolean
  onExpand: () => void
  onMove: (task: Task, status: TaskStatus) => void
  onRetry: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const isBlocked = task.status === 'blocked'
  const isDone = task.status === 'done'
  const nextIdx = TASK_COLUMNS.indexOf(task.status) + 1
  const nextStatusCandidate = nextIdx < TASK_COLUMNS.length ? TASK_COLUMNS[nextIdx] : undefined
  const nextStatus = (!isBlocked && !isDone && nextStatusCandidate && nextStatusCandidate !== 'blocked')
    ? nextStatusCandidate
    : undefined
  return (
    <div style={{ background: '#0d0d0d', border: `1px solid ${isBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem', cursor: 'pointer' }} onClick={onExpand}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ marginTop: '1px', flexShrink: 0 }}>
            {(() => { const I = TASK_STATUS_ICON[task.status]; return <I size={13} color={TASK_STATUS_COLOR[task.status]} /> })()}
          </div>
          <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: '#E5E7EB', lineHeight: 1.4 }}>{task.title}</span>
          <button onClick={e => { e.stopPropagation(); onExpand() }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: PRIORITY_COLOR[task.priority] }}>
            {task.priority}
          </span>
          {task.agent && (
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              → {task.agent.name}
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 0.75rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {task.description && (
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.75rem', lineHeight: 1.6 }}>{task.description}</p>
          )}
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
            {isBlocked ? (
              <button onClick={() => onRetry(task)} style={{
                flex: 1, padding: '0.35rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '5px', color: '#10B981', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              }}>
                <RotateCcw size={11} /> Retry
              </button>
            ) : nextStatus ? (
              <button onClick={() => onMove(task, nextStatus)} style={{
                flex: 1, padding: '0.35rem', background: '#10B98115', border: '1px solid #10B98130',
                borderRadius: '5px', color: '#10B981', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              }}>
                <ArrowRight size={11} /> {nextStatus.replace('_', ' ')}
              </button>
            ) : null}
            <button onClick={() => onDelete(task.id)} style={{
              padding: '0.35rem 0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: '5px', color: '#EF4444', cursor: 'pointer',
            }}>
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.75rem', background: '#0a0a0a',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px',
  color: '#F3F4F6', fontSize: '0.875rem', fontFamily: 'inherit',
  boxSizing: 'border-box',
}
