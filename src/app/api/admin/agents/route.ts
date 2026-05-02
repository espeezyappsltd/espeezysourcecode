import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) return null
  const profile = await getUserProfile(user.uid)
  if (!profile || (profile as any).role !== 'admin') return null
  
  const db = getAdminDb()
  if (!db) return null
  
  return { user, db }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { db } = auth

  try {
    const agentsSnapshot = await db.collection('agents').orderBy('specialisation').get()
    const agentsList = agentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Resolve "pair" information manually
    const agents = agentsList.map((agent: any) => {
      if (agent.pair_id) {
        const pair = agentsList.find(a => a.id === agent.pair_id)
        if (pair) {
          return { ...agent, pair: { id: (pair as any).id, name: (pair as any).name } }
        }
      }
      return { ...agent, pair: null }
    })

    const tasksSnapshot = await db.collection('agent_tasks')
      .where('status', '!=', 'done')
      .orderBy('status') // Firestore requirement: first orderBy must match inequality filter
      .orderBy('created_at', 'desc')
      .get()
    
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ agents, tasks })
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
      created_at: new Date().toISOString()
    }
    
    // If name is used to generate an ID (slug), we could do that here.
    // The original Supabase version used auto-generated IDs.
    // Firestore-schema suggests idStrategy: slug, but let's see if we should auto-generate.
    // I'll use .add() for auto-generation to be safe unless I'm sure about the slug.
    const docRef = await db.collection('agents').add(agentData)
    const saved = await docRef.get()
    
    return NextResponse.json({ agent: { id: saved.id, ...saved.data() } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
