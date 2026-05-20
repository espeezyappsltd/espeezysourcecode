/** Viewport-oriented list tuning for marketplace + hustle. */

export const LIST_MAX_ITEMS = 160

export const MOBILE_BREAKPOINT = 768
export const TABLET_BREAKPOINT = 1024

/** Below this count, render a plain list (virtualizer overhead not worth it). */
export const VIRTUALIZE_THRESHOLD = 20

export function getListPageLimit(viewportWidth?: number): number {
  const w = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024)
  if (w <= MOBILE_BREAKPOINT) return 16
  if (w <= TABLET_BREAKPOINT) return 24
  return 32
}

export function trimListTail<T>(items: T[], max = LIST_MAX_ITEMS): T[] {
  if (items.length <= max) return items
  return items.slice(items.length - max)
}
