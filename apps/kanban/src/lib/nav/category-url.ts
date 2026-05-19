/** URL builders for fast, link-based category & item navigation. */

export function marketplaceListUrl(opts?: {
  category?: string | null
  q?: string | null
  item?: string | null
}): string {
  const params = new URLSearchParams()
  if (opts?.category && opts.category !== 'All') params.set('category', opts.category)
  if (opts?.q?.trim()) params.set('q', opts.q.trim())
  if (opts?.item) params.set('item', opts.item)
  const q = params.toString()
  return q ? `/marketplace?${q}` : '/marketplace'
}

export function marketplaceCategoryUrl(category: string): string {
  return marketplaceListUrl({ category: category === 'All' ? null : category })
}

export function marketplaceItemUrl(itemId: string, category?: string | null): string {
  return marketplaceListUrl({ category, item: itemId })
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

export function hustleCategoryUrl(category: string, tab?: string): string {
  return hustleListUrl({
    tab,
    category: category === 'all' ? null : category,
  })
}

export function hustleItemUrl(taskId: string, opts?: { tab?: string; category?: string | null }): string {
  return hustleListUrl({ ...opts, task: taskId })
}

export function hustleTabUrl(tab: string): string {
  return hustleListUrl({ tab })
}
