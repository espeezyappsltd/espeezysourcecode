type CacheEntry<T> = { data: T; expiresAt: number }

const store = new Map<string, CacheEntry<unknown>>()
const MAX_ENTRIES = 64

export async function getCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expiresAt > now) return hit.data as T

  const data = await loader()
  if (store.size >= MAX_ENTRIES) {
    const first = store.keys().next().value
    if (first) store.delete(first)
  }
  store.set(key, { data, expiresAt: now + ttlMs })
  return data
}

export const CACHE_HEADERS = {
  publicShort: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' },
} as const
