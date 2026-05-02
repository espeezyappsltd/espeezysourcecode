import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

export const logEvent = async (eventData: Record<string, unknown>) => {
  try {
    const logsRef = collection(db, 'system_logs')
    await addDoc(logsRef, {
      ...eventData,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Critical failure writing to Firestore:', error)
  }
}

export const logActivity = async (
  userId: string,
  groupId: string | null | undefined,
  action: string,
  details: string,
  metadata?: Record<string, unknown>,
) => {
  await logEvent({
    user_id: userId,
    group_id: groupId ?? null,
    action,
    details,
    metadata: metadata ?? null,
  })
}
