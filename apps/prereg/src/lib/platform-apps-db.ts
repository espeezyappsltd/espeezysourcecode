import {
  PLATFORM_APPS_FALLBACK,
  normalizePlatformAppRow,
  type PlatformApp,
} from '@shared/platform-apps'
import { filterPublicCatalogApps } from '@shared/platform-production-catalog'
import { getSupabaseConfig, supaRest } from '@/app/api/_lib/supabase-rest'

export { normalizePlatformAppRow }

function resolveCatalogApps(apps: PlatformApp[]): PlatformApp[] {
  const filtered = filterPublicCatalogApps(apps)
  return filtered.length > 0 ? filtered : filterPublicCatalogApps(PLATFORM_APPS_FALLBACK)
}

export async function fetchPublishedPlatformApps(): Promise<PlatformApp[]> {
  const cfg = getSupabaseConfig()
  if (!cfg) return resolveCatalogApps(PLATFORM_APPS_FALLBACK)

  const query = new URLSearchParams({
    select: '*',
    published: 'eq.true',
    order: 'sort_order.asc,name.asc',
  })

  const { ok, data } = await supaRest(`platform_apps?${query}`, 'GET')
  if (!ok || !Array.isArray(data)) return resolveCatalogApps(PLATFORM_APPS_FALLBACK)

  const apps = data.map((row) => normalizePlatformAppRow(row as Record<string, unknown>))
  return resolveCatalogApps(apps)
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
