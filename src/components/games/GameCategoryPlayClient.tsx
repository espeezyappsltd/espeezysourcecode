'use client'

import { useMemo, useState } from 'react'
import { answerGameQuestion, startGameSession } from '@/services/games'

type Question = {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  points_value: number
}

export default function GameCategoryPlayClient({ slug }: { slug: string }) {
  const [guestName, setGuestName] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined)
  const [question, setQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionsTotal, setQuestionsTotal] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | {
    isComplete: boolean
    prizeCentsWon: number
    correctAnswer: string
    explanation?: string | null
  }>(null)
  const [error, setError] = useState<string | null>(null)

  const progressPct = useMemo(() => {
    if (!questionsTotal) return 0
    return Math.round((questionIndex / questionsTotal) * 100)
  }, [questionIndex, questionsTotal])

  async function start() {
    setLoading(true)
    setError(null)
    try {
      const data = await startGameSession({ categorySlug: slug, questionCount: 10, guestName: guestName || undefined })
      setSessionId(data.sessionId)
      setAccessToken(data.accessToken ?? undefined)
      setQuestion(data.firstQuestion)
      setQuestionIndex(0)
      setQuestionsTotal(data.questionsTotal)
      setScore(0)
      setResult(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start game')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer(answer: 'a' | 'b' | 'c' | 'd') {
    if (!sessionId || !question) return
    setLoading(true)
    setError(null)
    try {
      const data = await answerGameQuestion({
        sessionId,
        questionId: question.id,
        answer,
        accessToken,
      })
      setScore(data.score ?? score)
      setResult({
        isComplete: data.isComplete,
        prizeCentsWon: data.prizeCentsWon ?? 0,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      })

      if (data.isComplete) {
        setQuestion(null)
      } else {
        setQuestion(data.nextQuestion)
        setQuestionIndex((i) => i + 1)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit answer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: 0, letterSpacing: '-0.03em' }}>Category: {slug}</h1>
      <p style={{ color: 'var(--text-sub)' }}>Standalone game mode. Guests can play instantly. Members get profile-linked rewards.</p>

      {!sessionId ? (
        <section style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', padding: '1rem', maxWidth: 560 }}>
          <label htmlFor='guestName' style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-sub)', fontWeight: 700, marginBottom: '0.4rem' }}>
            Guest Display Name (optional)
          </label>
          <input
            id='guestName'
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder='Guest Scholar'
            style={{ width: '100%', background: 'var(--bg-sub)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.8rem' }}
          />
          <button
            onClick={start}
            disabled={loading}
            style={{ marginTop: '0.9rem', border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 10, padding: '0.65rem 1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Starting...' : 'Start Game'}
          </button>
        </section>
      ) : null}

      {sessionId ? (
        <section style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 999, background: 'var(--brand)' }} />
            </div>
            <p style={{ margin: '0.45rem 0 0', color: 'var(--text-sub)', fontSize: '0.8rem' }}>
              Score: {score} • Question {Math.min(questionIndex + 1, questionsTotal)} / {questionsTotal}
            </p>
          </div>

          {question ? (
            <article style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 14, padding: '1rem' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{question.question}</h2>
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {(['a', 'b', 'c', 'd'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => submitAnswer(key)}
                    disabled={loading}
                    style={{ textAlign: 'left', border: '1px solid var(--border)', background: 'var(--bg-sub)', color: 'var(--text-main)', borderRadius: 10, padding: '0.7rem', cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    <strong style={{ textTransform: 'uppercase' }}>{key}.</strong> {question[`option_${key}` as const]}
                  </button>
                ))}
              </div>
            </article>
          ) : null}

          {result?.isComplete ? (
            <article style={{ marginTop: '1rem', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', borderRadius: 14, padding: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>Session Complete</h3>
              <p style={{ margin: 0 }}>Final score: <strong>{score}</strong></p>
              <p style={{ margin: '0.4rem 0 0', color: 'var(--text-sub)' }}>Prize won: ${((result.prizeCentsWon ?? 0) / 100).toFixed(2)} {result.prizeCentsWon > 0 ? '(member mode payout queue)' : '(guest mode or no payout threshold)'}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      {error ? <p style={{ color: '#EF4444', marginTop: '0.8rem' }}>{error}</p> : null}
    </main>
  )
}
