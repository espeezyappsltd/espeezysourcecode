'use server'

import { getAdminDb } from '@/lib/firebase-admin'
import { revalidatePath } from 'next/cache'

export async function distributeTaskScore(taskId: string, assignees: string[]) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) throw new Error('Service Unavailable')
    const taskRef = adminDb.collection('tasks').doc(taskId)
    const taskSnap = await taskRef.get()

    if (!taskSnap.exists) throw new Error('Task node validation failed')
    
    const taskData = taskSnap.data()!
    if (taskData.score_awarded) {
      return { success: false, reason: 'Already awarded' }
    }

    // Safely traverse all assignees and globally inject +15 Validity Score internally
    if (assignees && assignees.length > 0) {
      for (const userId of assignees) {
        const profileRef = adminDb.collection('profiles').doc(userId)
        const profileSnap = await profileRef.get()
        if (profileSnap.exists) {
           const currentScore = profileSnap.data()?.total_score || 0
           await profileRef.update({ total_score: currentScore + 15 })
        }
      }
    }

    // Close the physical lock permanently
    await taskRef.update({ score_awarded: true })

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('Score distribution failed:', err.message)
    throw new Error(`Critical Error: ${err.message}`)
  }
}

export async function updateUserGameStats(userId: string, xpEarned: number, won: boolean) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) throw new Error('Service Unavailable')
    const statsRef = adminDb.collection('user_game_stats').doc(userId)
    const statsSnap = await statsRef.get()

    const currentStats = statsSnap.exists ? statsSnap.data()! : { total_xp: 0, wins: 0, games_played: 0 }

    const newData = {
      user_id: userId,
      total_xp: (currentStats.total_xp || 0) + xpEarned,
      wins: (currentStats.wins || 0) + (won ? 1 : 0),
      games_played: (currentStats.games_played || 0) + 1,
      updated_at: new Date().toISOString()
    }

    await statsRef.set(newData, { merge: true })

    revalidatePath('/dashboard/chillout', 'page')
    return { success: true, stats: newData }
  } catch (err: any) {
    console.error('Stats update failed:', err.message)
    throw new Error(`Admin Node Error: ${err.message}`)
  }
}
