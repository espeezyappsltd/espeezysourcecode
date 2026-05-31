/** URL builders for fast, link-based category & item navigation. */

export type ListUrlContext = {
  q?: string | null
  category?: string | null
}

/** Marketplace moved to Espeezy Studio (Premium) — Kanban links to /studio. */
export function marketplaceListUrl(_opts?: {
  category?: string | null
  q?: string | null
  item?: string | null
  inquiry?: string | null
  listing?: string | null
}): string {
  return '/studio'
}

export function marketplaceCategoryUrl(_category?: string, _ctx?: ListUrlContext): string {
  return '/studio'
}

export function marketplaceItemUrl(
  _itemId?: string,
  _opts?: { category?: string | null; q?: string | null },
): string {
  return '/studio'
}

/** Hustle moved to Espeezy Studio (Premium). */
export function hustleListUrl(_opts?: {
  tab?: string | null
  category?: string | null
  q?: string | null
  task?: string | null
}): string {
  return '/studio'
}

export function hustleCategoryUrl(_category?: string, _tab?: string, _ctx?: ListUrlContext): string {
  return '/studio'
}

export function hustleItemUrl(
  _taskId?: string,
  _opts?: { tab?: string; category?: string | null; q?: string | null },
): string {
  return '/studio'
}

export function hustleTabUrl(
  _tab?: string,
  _ctx?: { category?: string | null; q?: string | null },
): string {
  return '/studio'
}

export function hustleNavContext(
  tab: string,
  category: string,
  q: string,
): { tab: string; category: string | null; q: string | null } {
  return {
    tab,
    category: category !== 'all' ? category : null,
    q: q.trim() || null,
  }
}

export function marketplaceNavContext(
  activeCategory: string,
  q: string,
): { category: string | null; q: string | null } {
  return {
    category: activeCategory !== 'All' ? activeCategory : null,
    q: q.trim() || null,
  }
}

export function askListUrl(opts?: {
  category?: string | null
  q?: string | null
  page?: number | null
}): string {
  const params = new URLSearchParams()
  if (opts?.category && opts.category !== 'all') params.set('category', opts.category)
  if (opts?.q?.trim()) params.set('q', opts.q.trim())
  if (opts?.page && opts.page > 1) params.set('page', String(opts.page))
  const qs = params.toString()
  return qs ? `/ask?${qs}` : '/ask'
}

export function askCategoryUrl(category: string, ctx?: ListUrlContext & { page?: number }): string {
  return askListUrl({
    category: category === 'all' ? null : category,
    q: ctx?.q,
    page: ctx?.page && ctx.page > 1 ? ctx.page : null,
  })
}

export function askNavContext(category: string, q: string): { category: string | null; q: string | null } {
  return {
    category: category !== 'all' ? category : null,
    q: q.trim() || null,
  }
}
