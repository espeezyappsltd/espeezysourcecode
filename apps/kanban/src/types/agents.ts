export type AgentStatus = 'active' | 'paused' | 'training'
export type AgentSpec = 'frontend' | 'backend' | 'devops'
export type AgentRole = 'builder' | 'validator'
export type AgentTaskStatus = 'not_started' | 'in_progress' | 'review' | 'done' | 'blocked'
export type AgentTaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface AgentPairRef {
  id: string
  name: string
}

export interface Agent {
  id: string
  name: string
  specialisation: AgentSpec
  role: AgentRole
  status: AgentStatus
  capabilities: string[]
  tasks_completed: number
  system_prompt?: string
  pair_id?: string | null
  pair?: AgentPairRef | null
}

export interface AgentTask {
  id: string
  title: string
  description?: string
  status: AgentTaskStatus
  priority: AgentTaskPriority
  assigned_agent_id?: string
  agent?: { id: string; name: string; specialisation: string } | null
  created_at: string
  started_at?: string
  completed_at?: string
  output_artifacts?: unknown[]
  logs?: string
}
