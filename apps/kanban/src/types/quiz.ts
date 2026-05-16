export interface QuizQuestion {
  question: string
  type: string
  difficulty_multiplier: number
  options?: string[]
  correct_answer?: string | number
  /** API alias used by quiz routes and room UI */
  correctAnswer?: string | number
}

export interface QuizScoreEntry {
  userId: string
  userName: string
  points: number
}

export interface SkirmishConfig {
  difficulty: string
  mode: string
}

export interface SkirmishState {
  quizStatus: 'setup' | 'playing' | 'results'
  quizQuestions: QuizQuestion[]
  currentQuestionIndex: number
  quizScores: QuizScoreEntry[]
  roundStartTime: number
  timerDuration: number
  config: SkirmishConfig
  activeTurnUserId?: string | null
}
