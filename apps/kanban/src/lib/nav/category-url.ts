/** URL builders for fast, link-based category & item navigation. */

export type ListUrlContext = {
  q?: string | null
  category?: string | null
}

export function marketplaceListUrl(opts?: {
  category?: string | null
  q?: string | null
  item?: string | null
  inquiry?: string | null
  listing?: string | null
}): string {
  const params = new URLSearchParams()
  if (opts?.category && opts.category !== 'All') params.set('category', opts.category)
  if (opts?.q?.trim()) params.set('q', opts.q.trim())
  if (opts?.item) params.set('item', opts.item)
  if (opts?.inquiry) params.set('inquiry', opts.inquiry)
  if (opts?.listing) params.set('listing', opts.listing)
  const q = params.toString()
  return q ? `/marketplace?${q}` : '/marketplace'
}

export function marketplaceCategoryUrl(category: string, ctx?: ListUrlContext): string {
  return marketplaceListUrl({
    category: category === 'All' ? null : category,
    q: ctx?.q,
  })
}

export function marketplaceItemUrl(
  itemId: string,
  opts?: { category?: string | null; q?: string | null },
): string {
  return marketplaceListUrl({ category: opts?.category, q: opts?.q, item: itemId })
}

export function hustleListUrl(opts?: {
  tab?: string | null
  category?: string | null
  q?: string | null
  task?: string | null
}): string {
  const params = new URLSearchParams()
  if (opts?.tab && opts.tab !== 'marketplace') params.set('tab', opts.tab)
  if (opts?.category && opts.category !== 'all') params.set('category', opts.category)
  if (opts?.q?.trim()) params.set('q', opts.q.trim())
  if (opts?.task) params.set('task', opts.task)
  const q = params.toString()
  return q ? `/hustle?${q}` : '/hustle'
}

export function hustleCategoryUrl(category: string, tab?: string, ctx?: ListUrlContext): string {
  return hustleListUrl({
    tab,
    category: category === 'all' ? null : category,
    q: ctx?.q,
  })
}

export function hustleItemUrl(
  taskId: string,
  opts?: { tab?: string; category?: string | null; q?: string | null },
): string {
  return hustleListUrl({ ...opts, task: taskId })
}

export function hustleTabUrl(
  tab: string,
  ctx?: { category?: string | null; q?: string | null },
): string {
  return hustleListUrl({
    tab,
    category: ctx?.category && ctx.category !== 'all' ? ctx.category : null,
    q: ctx?.q,
  })
}

/** Preserve current list filters when building the next link. */
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
