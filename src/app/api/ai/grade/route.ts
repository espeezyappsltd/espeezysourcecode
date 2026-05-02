import { NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
export const dynamic = 'force-dynamic'


const OPENAI_API_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
const OPENAI_API_KEY = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return new NextResponse(JSON.stringify({ error: 'AI Gateway is not configured.' }), { status: 500 })
  }

  try {
    // Get session token from headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required.' }), { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const { question, correctAnswer, userResponse } = await req.json()
    
    const prompt = `Act as the Master Librarian of the Espeezy Archives. 
You are evaluating a scholar's attempt to synthesize knowledge during a high-stakes Academic Skirmish.

Question: "${question}"
Reference Truth: "${correctAnswer}"
Scholar's Synthesis: "${userResponse}"

Evaluation Criteria:
1. Accuracy: Does it align with the Reference Truth?
2. Eloquence: Is the synthesis well-structured?
3. Cleverness: Does the scholar show true insight?

Respond ONLY with a JSON object:
{
  "score": number (0 to 100),
  "isCorrect": boolean (true if score >= 75),
  "critique": "A brief (12 word max) witty, supportive, and slightly sophisticated praise or correction."
}`

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a rigorous but fair academic skirmish judge. Evaluate accuracy against reference truth. Be witty and brief.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 150,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) throw new Error('Grading flux interrupted.')

    const data = await response.json()
    const result = JSON.parse(data?.choices?.[0]?.message?.content)

    return new NextResponse(JSON.stringify(result), { status: 200 })
  } catch (err: any) {
    console.error('Grading Error:', err.message)
    return new NextResponse(JSON.stringify({ error: 'Evaluation failed.' }), { status: 500 })
  }
}
