'use client'

import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { SkirmishRoomView } from '../components/SkirmishRoomView'

export default function QuizRoomPage() {
  const params = useParams()
  const roomId = params?.id as string
  
  if (!roomId) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return <SkirmishRoomView roomId={roomId} />
}
