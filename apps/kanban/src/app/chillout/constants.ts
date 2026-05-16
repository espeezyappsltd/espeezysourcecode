import { ShieldCheck, Cpu, Gamepad2, Terminal } from 'lucide-react'
import type { ChilloutTopic } from './types'

export const CHILLOUT_TOPICS: ChilloutTopic[] = [
  {
    id: 'cyber_ethics',
    name: 'Cyber Ethics & Law',
    icon: ShieldCheck,
    color: 'var(--error)',
    description: 'Master the legal landscape of the digital academic frontier.',
  },
  {
    id: 'logic',
    name: 'Computing Logic',
    icon: Cpu,
    color: 'var(--warning)',
    description: 'Test your raw logic with complex computing patterns.',
  },
  {
    id: 'pop_culture',
    name: 'Digital History',
    icon: Gamepad2,
    color: 'var(--success)',
    description: 'From Turing to Jobs: The history of the digital era.',
  },
  {
    id: 'institutional',
    name: 'Digital Marketing',
    icon: Terminal,
    color: 'var(--accent)',
    description: 'SEO, SEM, and the art of online selling.',
  },
]

export const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'] as const
export const GAME_MODE_OPTIONS = ['Speed Recall', 'AI Evaluated'] as const
export const ROUND_OPTIONS = [3, 5, 10] as const
