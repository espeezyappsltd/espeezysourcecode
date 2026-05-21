import type { SupabaseClient } from '@supabase/supabase-js'
import {
  countVaultFiles,
  summarizeTopLevelFolders,
  type PersonalAssetSummary,
} from '@shared/personal-assets-folders'
import { getStorageQuotaBytes, resolveStoragePlan } from '@shared/storage-quotas'
import { WORKSPACE_FOLDER_DEFS } from '@shared/workspace-folder-defs'
import { effectiveProfileTier } from '@shared/profile-tier'

export type GamesRecentSession = {
  id: string
  score: number | null
  prize_cents_won: number | null
  status: string
  completed_at: string | null
  created_at: string
  categoryName: string | null
  categorySlug: string | null
}

export type GamesFolderRow = {
  path: string
  name: string
  fileCount: number
  description: string | null
  isDefault: boolean
}

export type LoadedGamesProfile = {
  profile: {
    id: string
    full_name: string | null
    username: string | null
    email: string | null
    avatar_url: string | null
    biography: string | null
    tagline: string | null
    subscription_plan: string | null
    tier: string | null
    created_at: string
    total_score: number | null
    badges_count: number | null
    storage_used: number | null
  }
  stats: {
    gamesPlayed: number
    totalScore: number
    totalPrizeCents: number
    activeSessions: number
  }
  storage: {
    used: number
    quota: number
    plan: string
    percentUsed: number
  }
  folders: GamesFolderRow[]
  vaultFileCount: number
  recentSessions: GamesRecentSession[]
}

function mergeFolderRows(assetFolders: ReturnType<typeof summarizeTopLevelFolders>): GamesFolderRow[] {
  const byPath = new Map<string, GamesFolderRow>()

  for (const def of WORKSPACE_FOLDER_DEFS) {
    byPath.set(def.path, {
      path: def.path,
      name: def.name,
      fileCount: 0,
      description: def.description,
      isDefault: true,
    })
  }

  for (const row of assetFolders) {
    const existing = byPath.get(row.path)
    if (existing) {
      existing.fileCount = row.fileCount
    } else {
      byPath.set(row.path, {
        path: row.path,
        name: row.name,
        fileCount: row.fileCount,
        description: null,
        isDefault: false,
      })
    }
  }

  return Array.from(byPath.values()).sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export async function loadGamesProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<LoadedGamesProfile | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, full_name, username, email, avatar_url, biography, tagline, subscription_plan, tier, created_at, total_score, badges_count, storage_used',
    )
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return null

  const [{ data: completedSessions }, { data: activeSessions }, { data: assets }, { data: recentRaw }] =
    await Promise.all([
      supabase
        .from('quiz_sessions')
        .select('id, score, prize_cents_won')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      supabase
        .from('quiz_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('personal_assets')
        .select('id, title, asset_type, asset_url, folder, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('quiz_sessions')
        .select('id, score, prize_cents_won, status, completed_at, created_at, category_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8),
    ])

  const gamesPlayed = completedSessions?.length ?? 0
  const totalScore = (completedSessions ?? []).reduce((acc, s) => acc + (s.score ?? 0), 0)
  const totalPrizeCents = (completedSessions ?? []).reduce((acc, s) => acc + (s.prize_cents_won ?? 0), 0)

  const assetRows = (assets ?? []) as PersonalAssetSummary[]
  const folderSummaries = summarizeTopLevelFolders(assetRows)
  const folders = mergeFolderRows(folderSummaries)
  const vaultFileCount = countVaultFiles(assetRows)

  const plan = resolveStoragePlan(profile)
  const storageUsed = profile.storage_used ?? 0
  const storageQuota = getStorageQuotaBytes(plan)
  const percentUsed =
    storageQuota > 0 ? Math.min(100, Math.round((storageUsed / storageQuota) * 100)) : 0

  const categoryIds = [
    ...new Set((recentRaw ?? []).map((s) => s.category_id).filter((id): id is string => Boolean(id))),
  ]

  let categoryMap = new Map<string, { name: string; slug: string }>()
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from('quiz_categories')
      .select('id, name, slug')
      .in('id', categoryIds)

    categoryMap = new Map(
      (categories ?? []).map((c) => [c.id, { name: c.name as string, slug: c.slug as string }]),
    )
  }

  const recentSessions: GamesRecentSession[] = (recentRaw ?? []).map((s) => {
    const cat = s.category_id ? categoryMap.get(s.category_id) : undefined
    return {
      id: s.id,
      score: s.score,
      prize_cents_won: s.prize_cents_won,
      status: s.status,
      completed_at: s.completed_at,
      created_at: s.created_at,
      categoryName: cat?.name ?? null,
      categorySlug: cat?.slug ?? null,
    }
  })

  const effectiveTier = effectiveProfileTier(profile)

  return {
    profile: {
      ...profile,
      tier: effectiveTier,
    },
    stats: {
      gamesPlayed,
      totalScore,
      totalPrizeCents,
      activeSessions: activeSessions?.length ?? 0,
    },
    storage: {
      used: storageUsed,
      quota: storageQuota,
      plan,
      percentUsed,
    },
    folders,
    vaultFileCount,
    recentSessions,
  }
}
