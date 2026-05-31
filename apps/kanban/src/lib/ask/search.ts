import type { AskCategoryFilter, AskResource } from './types'

export const ASK_PAGE_SIZE = 20

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase()
}

function scoreResource(item: AskResource, terms: string[]): number {
  const haystack = [
    item.title,
    item.description,
    item.category,
    item.kind,
    ...item.tags,
  ]
    .join(' ')
    .toLowerCase()

  let score = 0
  for (const term of terms) {
    if (!haystack.includes(term)) return 0
    if (item.title.toLowerCase().includes(term)) score += 12
    if (item.tags.some((t) => t.toLowerCase().includes(term))) score += 8
    if (item.description.toLowerCase().includes(term)) score += 4
    score += 2
  }
  return score
}

export function filterAskResources(
  items: AskResource[],
  query: string,
  category: AskCategoryFilter,
): AskResource[] {
  let list =
    category === 'all' ? items : items.filter((r) => r.category === category)

  const q = normalizeQuery(query)
  if (!q) {
    return [...list].sort((a, b) => a.title.localeCompare(b.title))
  }

  const terms = q.split(/\s+/).filter(Boolean)
  return list
    .map((item) => ({ item, score: scoreResource(item, terms) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.item.title.localeCompare(b.item.title)
    })
    .map((row) => row.item)
}

export function paginateAskResources<T>(
  items: T[],
  page: number,
  pageSize = ASK_PAGE_SIZE,
): {
  items: T[]
  page: number
  totalPages: number
  total: number
  from: number
  to: number
} {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const slice = items.slice(start, start + pageSize)
  return {
    items: slice,
    page: safePage,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  }
}
