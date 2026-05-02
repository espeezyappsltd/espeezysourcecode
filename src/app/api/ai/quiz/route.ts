import { NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
export const dynamic = 'force-dynamic'


const OPENAI_API_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
const OPENAI_API_KEY = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return new NextResponse(JSON.stringify({ error: 'AI Gateway is not configured.' }), { status: 500 })
  }

  const db = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await db.auth.getUser()

  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Authentication required.' }), { status: 401 })
  }

  try {
    const { topic, difficulty, mode, count = 5 } = await req.json()
    
    // Usage Check
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: usageCount } = await db
      .from('ai_usage')
      .select('id', { count: 'exact' })
      .eq('profile_id', user.id)
      .gte('created_at', windowStart)

    if ((usageCount ?? 0) >= 20) { // Higher limit for gaming
      return new NextResponse(JSON.stringify({ error: 'Daily skirmish limit reached.' }), { status: 429 })
    }

    const prompt = `Generate ${count} high-quality academic skirmish questions about the topic: "${topic}".
Difficulty: ${difficulty.toUpperCase()}.
Mode Preference: ${mode === 'Evaluated' ? 'Prioritize Explanation questions' : 'Prioritize Multiple Choice questions'}.

Respond ONLY with a raw JSON array of objects. Do not include markdown formatting or backticks.
Schema:
{
  "id": string (unique),
  "question": string,
  "options": string[] (provide 4 options for multiple_choice, null for explanation),
  "correctAnswer": number (index for options) or string (comprehensive answer for explanation),
  "explanation": string (why it is correct),
  "type": "multiple_choice" | "explanation",
  "difficulty_multiplier": number (1 to 3 based on complexity)
}`

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Preferred for logic/academic quality
        messages: [
          { role: 'system', content: 'You are a high-level academic skirmish engine for Espeezy. You generate rigorous, challenging questions that test deep understanding. Return results in pure JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(err)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    
    // Parse result (GPT might wrap in an object even if asked for array)
    let questions = JSON.parse(content)
    if (questions.questions) questions = questions.questions // handle common wrapper

    await db.from('ai_usage').insert([{ profile_id: user.id, action: 'skirmish_generation' }])

    return new NextResponse(JSON.stringify({ questions }), { status: 200 })
  } catch (err: unknown) {
    console.error('Quiz Gen Error:', err instanceof Error ? err.message : err)
    return new NextResponse(JSON.stringify({ error: 'Failed to synthesize skirmish data.' }), { status: 500 })
  }
}
