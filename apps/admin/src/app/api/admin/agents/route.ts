import { NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
import { getAdminDb } from '@/lib/supabase/admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'
import type { Agent, AgentPairRef } from '@/types/agents'
import { getErrorMessage } from '@/utils/errors'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) return null
  const profile = await getUserProfile(user.uid)
  if (!profile || profile.role !== 'admin') return null
  
  const db = getAdminDb()
  if (!db) return null
  
  return { user, db }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { db } = auth

  try {
    const { data: agentsList, error: agentsError } = await db
      .from('agents')
      .select('id, name, status, specialisation, pair_id, created_at')
      .order('specialisation', { ascending: true })
    if (agentsError) {
      throw agentsError
    }
    
    // Resolve "pair" information manually
    type AgentListRow = Pick<Agent, 'id' | 'name' | 'status' | 'specialisation' | 'pair_id'>
    type AgentListItem = AgentListRow & { pair: AgentPairRef | null }
    const agents: AgentListItem[] = (agentsList ?? []).map((agent: AgentListRow) => {
      if (agent.pair_id) {
        const pair = (agentsList ?? []).find((a) => a.id === agent.pair_id)
        if (pair) {
          return { ...agent, pair: { id: pair.id, name: pair.name } }
        }
      }
      return { ...agent, pair: null }
    })

    const { data: tasks, error: tasksError } = await db
      .from('agent_tasks')
      .select('id, agent_id, task, status, priority, created_at, updated_at')
      .neq('status', 'done')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(100)

    if (tasksError) {
      throw tasksError
    }

    return NextResponse.json({ agents, tasks: tasks ?? [] })
  } catch (error) {
    console.error('[admin-agents] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch agents and tasks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { db } = auth
  const body = await req.json()
  const { name, specialisation, role, status, system_prompt, capabilities } = body

  if (!name || !specialisation || !role) {
    return NextResponse.json({ error: 'name, specialisation, and role are required' }, { status: 400 })
  }

  try {
    const agentData = {
      name,
      specialisation,
      role,
      status: status ?? 'active',
      system_prompt: system_prompt ?? '',
      capabilities: capabilities ?? [],
    }

    const { data: saved, error } = await db
      .from('agents')
      .insert(agentData)
      .select('id, name, specialisation, role, status, system_prompt, capabilities, pair_id, created_at')
      .single()

    if (error || !saved) {
      throw error ?? new Error('Failed to create agent')
    }

    return NextResponse.json({ agent: saved }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
