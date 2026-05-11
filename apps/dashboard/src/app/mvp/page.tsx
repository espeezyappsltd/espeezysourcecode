'use client'

import { KanbanMvpView } from '@/features/mvp/KanbanMvpView'
import { useKanbanMvp } from '@/features/mvp/useKanbanMvp'

export default function KanbanMvpPage() {
  const kanbanMvp = useKanbanMvp()

  return <KanbanMvpView {...kanbanMvp} />
}
