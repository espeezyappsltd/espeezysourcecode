'use client'

import { KanbanHomeView } from '@/features/home/KanbanHomeView'
import { useKanbanHome } from '@/features/home/useKanbanHome'
import LiveChatWidget from '@/components/LiveChatWidget'

export default function KanbanHomePage() {
  const { user, registeredCount, handleLogout } = useKanbanHome()

  return (
    <>
      <KanbanHomeView user={user} registeredCount={registeredCount} onLogout={handleLogout} />
      {user && <LiveChatWidget appScope="kanban" user={user} />}
    </>
  )
}
