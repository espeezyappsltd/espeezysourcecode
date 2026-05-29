import {
  PLATFORM_APPS_FALLBACK,
  normalizePlatformAppRow,
  type PlatformApp,
} from '@shared/platform-apps'
import { getSupabaseConfig, supaRest } from '@/app/api/_lib/supabase-rest'

export { normalizePlatformAppRow }

export async function fetchPublishedPlatformApps(): Promise<PlatformApp[]> {
  const cfg = getSupabaseConfig()
  if (!cfg) return PLATFORM_APPS_FALLBACK

  const query = new URLSearchParams({
    select: '*',
    published: 'eq.true',
    order: 'sort_order.asc,name.asc',
  })

  const { ok, data } = await supaRest(`platform_apps?${query}`, 'GET')
  if (!ok || !Array.isArray(data)) return PLATFORM_APPS_FALLBACK

  return data.map((row) => normalizePlatformAppRow(row as Record<string, unknown>))
}

export async function fetchPlatformAppBySlug(slug: string): Promise<PlatformApp | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) {
    return PLATFORM_APPS_FALLBACK.find((a) => a.slug === slug) ?? null
  }

  const query = new URLSearchParams({
    select: '*',
    slug: `eq.${slug}`,
    published: 'eq.true',
    limit: '1',
  })

  const { ok, data } = await supaRest(`platform_apps?${query}`, 'GET')
  if (!ok || !Array.isArray(data) || data.length === 0) {
    return PLATFORM_APPS_FALLBACK.find((a) => a.slug === slug) ?? null
  }

  return normalizePlatformAppRow(data[0] as Record<string, unknown>)
}
