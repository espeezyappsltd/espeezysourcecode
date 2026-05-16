/**
 * In-memory TTL cache for API route handlers (Node.js only).
 */

type CacheEntry<T> = { data: T; expiresAt: number }

const store = new Map<string, CacheEntry<unknown>>()
const MAX_ENTRIES = 512

function pruneIfNeeded() {
  if (store.size < MAX_ENTRIES) return
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key)
    if (store.size < MAX_ENTRIES * 0.75) break
  }
  if (store.size >= MAX_ENTRIES) {
    const first = store.keys().next().value
    if (first) store.delete(first)
  }
}

export async function getCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expiresAt > now) return hit.data as T

  const data = await loader()
  pruneIfNeeded()
  store.set(key, { data, expiresAt: now + ttlMs })
  return data
}

export const CACHE_HEADERS = {
  publicShort: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' },
  publicMedium: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  private: { 'Cache-Control': 'private, no-store, max-age=0' },
} as const
