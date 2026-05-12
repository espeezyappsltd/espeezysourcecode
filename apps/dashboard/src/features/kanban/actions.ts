'use server'

export async function distributeTaskScore(taskId: string, assignees: string[]) {
  console.log(`[STUB] Distributing score for task ${taskId} to ${assignees.join(', ')}`);
  return { success: true };
}
