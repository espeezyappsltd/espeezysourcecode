import { getAdminDb } from '@/lib/supabase/admin'
import {
  ONBOARDING_CREDIT_REWARD,
  ONBOARDING_MARKER_PREFIX,
  ONBOARDING_TASK_TEMPLATES,
  isOnboardingDescription,
  parseOnboardingKey,
  type OnboardingTaskKey,
} from '@/lib/onboarding/dashboard-tasks'

const BUCKET = 'user-assets'

export type OnboardingEnsureResult = {
  seeded: number
  total: number
  alreadyComplete: boolean
}

export type OnboardingCompletionResult = {
  allComplete: boolean
  rewardGranted: boolean
  creditsAdded?: number
  assetId?: string
  assetUrl?: string
}

function buildReportContent(userName: string, completedAt: string, keys: OnboardingTaskKey[]) {
  const lines = [
    'ESPEEZY ONBOARDING CHECK — COMPLETE REPORT',
    '==========================================',
    '',
    `Scholar: ${userName}`,
    `Completed at: ${completedAt}`,
    `Reward: +${ONBOARDING_CREDIT_REWARD} Espeezy credits`,
    '',
    'Features verified:',
    ...keys.map((k) => {
      const t = ONBOARDING_TASK_TEMPLATES.find((x) => x.key === k)
      return `  ✓ ${t?.title ?? k} (${t?.path ?? '/'})`
    }),
    '',
    'This report was generated automatically when you moved all onboarding',
    'tasks on your dashboard to Done.',
    '',
    '— Espeezy Platform Analytics',
  ]
  return lines.join('\n')
}

export async function ensureOnboardingTasksForUser(
  userId: string,
  groupId: string,
): Promise<OnboardingEnsureResult> {
  const db = getAdminDb()

  const { data: profile } = await db
    .from('profiles')
    .select('onboarding_reward_claimed, onboarding_completed_at')
    .eq('id', userId)
    .single()

  if (profile?.onboarding_reward_claimed) {
    return { seeded: 0, total: ONBOARDING_TASK_TEMPLATES.length, alreadyComplete: true }
  }

  const { data: existing } = await db
    .from('tasks')
    .select('id, description, assignees, status')
    .eq('group_id', groupId)
    .contains('assignees', [userId])

  const existingKeys = new Set<OnboardingTaskKey>()
  for (const row of existing ?? []) {
    const key = parseOnboardingKey(row.description as string)
    if (key) existingKeys.add(key)
  }

  let seeded = 0
  for (const template of ONBOARDING_TASK_TEMPLATES) {
    if (existingKeys.has(template.key)) continue

    const { error } = await db.from('tasks').insert({
      title: template.title,
      description: template.description,
      status: 'To Do',
      category: template.category,
      assignees: [userId],
      group_id: groupId,
      due_date: null,
      created_by: userId,
    })

    if (!error) seeded += 1
  }

  return {
    seeded,
    total: ONBOARDING_TASK_TEMPLATES.length,
    alreadyComplete: Boolean(profile?.onboarding_completed_at),
  }
}

export async function seedOnboardingForAllUsers(): Promise<{ users: number; tasksCreated: number }> {
  const db = getAdminDb()
  const { data: profiles } = await db
    .from('profiles')
    .select('id, group_id')
    .not('group_id', 'is', null)

  let users = 0
  let tasksCreated = 0

  for (const p of profiles ?? []) {
    if (!p.group_id) continue
    const result = await ensureOnboardingTasksForUser(p.id, p.group_id)
    if (result.seeded > 0) users += 1
    tasksCreated += result.seeded
  }

  return { users, tasksCreated }
}

async function getUserOnboardingTasks(userId: string, groupId: string) {
  const db = getAdminDb()
  const { data } = await db
    .from('tasks')
    .select('id, title, description, status, assignees, group_id, created_at, updated_at')
    .eq('group_id', groupId)
    .contains('assignees', [userId])

  return (data ?? []).filter((t) => isOnboardingDescription(t.description as string))
}

export async function checkAndGrantOnboardingCompletion(
  userId: string,
  groupId: string,
): Promise<OnboardingCompletionResult> {
  const db = getAdminDb()

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, email, onboarding_reward_claimed, espeezy_credits')
    .eq('id', userId)
    .single()

  if (profile?.onboarding_reward_claimed) {
    return { allComplete: true, rewardGranted: false }
  }

  const onboardingTasks = await getUserOnboardingTasks(userId, groupId)
  const requiredKeys = ONBOARDING_TASK_TEMPLATES.map((t) => t.key)
  const doneKeys = onboardingTasks
    .filter((t) => t.status === 'Done')
    .map((t) => parseOnboardingKey(t.description as string))
    .filter((k): k is OnboardingTaskKey => k !== null)

  const allComplete = requiredKeys.every((k) => doneKeys.includes(k))

  if (!allComplete) {
    return { allComplete: false, rewardGranted: false }
  }

  const completedAt = new Date().toISOString()
  const userName = profile?.full_name ?? profile?.email ?? 'Espeezy Scholar'
  const reportBody = buildReportContent(userName, completedAt, requiredKeys)
  const reportBytes = new TextEncoder().encode(reportBody)
  const storagePath = `${userId}/onboarding/onboarding-check-complete-${Date.now()}.txt`

  const { error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, reportBytes, {
    contentType: 'text/plain; charset=utf-8',
    upsert: false,
  })

  if (uploadError) {
    throw new Error(`Report upload failed: ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = db.storage.from(BUCKET).getPublicUrl(storagePath)

  const { data: asset, error: assetError } = await db
    .from('personal_assets')
    .insert({
      user_id: userId,
      title: 'Onboarding Check Complete Report.txt',
      description: 'Auto-generated when you finished all Espeezy feature onboarding tasks.',
      asset_type: 'file',
      asset_url: publicUrl,
      size_bytes: reportBytes.length,
      folder: '/',
      metadata: {
        credit_value: 0,
        onboarding_report: true,
        completed_at: completedAt,
        storage_path: storagePath,
      },
    })
    .select('id')
    .single()

  if (assetError) throw assetError

  if (reportBytes.length > 0) {
    const { error: storageRpcError } = await db.rpc('increment_storage_used', {
      user_id: userId,
      amount: reportBytes.length,
    })
    if (storageRpcError) {
      await db.from('personal_assets').delete().eq('id', asset.id)
      await db.storage.from(BUCKET).remove([storagePath])
      throw storageRpcError
    }
  }

  const currentCredits = profile?.espeezy_credits ?? 0
  const newCredits = currentCredits + ONBOARDING_CREDIT_REWARD

  await db
    .from('profiles')
    .update({
      espeezy_credits: newCredits,
      onboarding_completed_at: completedAt,
      onboarding_reward_claimed: true,
    })
    .eq('id', userId)

  await db.from('notifications').insert({
    user_id: userId,
    type: 'onboarding_complete',
    title: 'Onboarding complete!',
    message: `+${ONBOARDING_CREDIT_REWARD} Espeezy credits added. Your completion report is in My Assets.`,
    link: '/assets',
    metadata: { asset_id: asset?.id, credits: ONBOARDING_CREDIT_REWARD },
  })

  return {
    allComplete: true,
    rewardGranted: true,
    creditsAdded: ONBOARDING_CREDIT_REWARD,
    assetId: asset?.id,
    assetUrl: publicUrl,
  }
}

export async function afterOnboardingTaskUpdate(
  taskId: string,
  userId: string,
  groupId: string,
  status: string,
): Promise<OnboardingCompletionResult | null> {
  if (status !== 'Done') return null

  const db = getAdminDb()
  const { data: task } = await db.from('tasks').select('description').eq('id', taskId).single()

  if (!task || !isOnboardingDescription(task.description as string)) return null

  return checkAndGrantOnboardingCompletion(userId, groupId)
}
