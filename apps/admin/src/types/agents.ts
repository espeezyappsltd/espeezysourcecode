export type AgentStatus = 'active' | 'paused' | 'training'
export type AgentSpec = 'frontend' | 'backend' | 'devops'
export type AgentRole = 'builder' | 'validator'

export interface AgentPairRef {
  id: string
  name: string
}

export interface Agent {
  id: string
  name: string
  specialisation: AgentSpec | string
  role: AgentRole | string
  status: AgentStatus | string
  capabilities?: string[]
  tasks_completed?: number
  system_prompt?: string
  pair_id?: string | null
  pair?: AgentPairRef | null
}
