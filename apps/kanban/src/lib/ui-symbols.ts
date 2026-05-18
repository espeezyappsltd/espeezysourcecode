/** Unicode UI symbols — avoid mojibake from corrupted UTF-8 in source files. */

export const APPROX = '\u2248'
export const EN_DASH = '\u2013'
export const ELLIPSIS = '\u2026'
export const MIDDLE_DOT = '\u00b7'
export const POUND = '\u00a3'

export function cmdKeyLabel(): string {
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)) {
    return '\u2318'
  }
  return 'Ctrl+'
}

export function searchShortcutLabel(): string {
  return `${cmdKeyLabel()}K`
}
