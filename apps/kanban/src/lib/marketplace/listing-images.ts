/** Always-available fallback (static file in /public). */
export const MARKETPLACE_PLACEHOLDER_SRC = '/marketplace/placeholder-default.svg'

const SUPABASE_ORIGIN = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ??
  ''
).replace(/\/$/, '')

export function resolveListingImageUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`

  if (trimmed.startsWith('/') && SUPABASE_ORIGIN) {
    if (trimmed.startsWith('/storage/')) return `${SUPABASE_ORIGIN}${trimmed}`
    return `${SUPABASE_ORIGIN}/storage/v1/object/public/marketplace${trimmed}`
  }

  if (trimmed.includes('supabase.co') && !trimmed.startsWith('http')) {
    return `https://${trimmed}`
  }

  return trimmed
}

/** Coerce DB/API image payloads into a clean URL list. */
export function normalizeListingImages(raw: unknown): string[] {
  if (raw == null) return []

  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? resolveListingImageUrl(item) : null))
      .filter((url): url is string => Boolean(url))
  }

  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return []
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        const parsed = JSON.parse(s) as unknown
        return normalizeListingImages(parsed)
      } catch {
        /* fall through */
      }
    }
    const one = resolveListingImageUrl(s)
    return one ? [one] : []
  }

  return []
}

export function primaryListingImage(images: unknown): string | null {
  const list = normalizeListingImages(images)
  return list[0] ?? null
}

export type PlaceholderTone = {
  gradient: string
  accent: string
  label: string
}

const CATEGORY_TONES: Record<string, PlaceholderTone> = {
  Electronics: {
    gradient: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 55%, #0f172a 100%)',
    accent: '#38bdf8',
    label: 'Electronics',
  },
  Textbooks: {
    gradient: 'linear-gradient(145deg, #1a1a2e 0%, #312e81 55%, #1a1a2e 100%)',
    accent: '#a78bfa',
    label: 'Textbooks',
  },
  'Lab Equipment': {
    gradient: 'linear-gradient(145deg, #0f1f17 0%, #14532d 55%, #0f1f17 100%)',
    accent: '#34d399',
    label: 'Lab',
  },
  Stationery: {
    gradient: 'linear-gradient(145deg, #1c1917 0%, #44403c 55%, #1c1917 100%)',
    accent: '#fbbf24',
    label: 'Stationery',
  },
  Hardware: {
    gradient: 'linear-gradient(145deg, #1e1b4b 0%, #4c1d95 55%, #1e1b4b 100%)',
    accent: '#c084fc',
    label: 'Hardware',
  },
  Tutorials: {
    gradient: 'linear-gradient(145deg, #042f2e 0%, #0d9488 55%, #042f2e 100%)',
    accent: '#2dd4bf',
    label: 'Tutorial',
  },
  Other: {
    gradient: 'linear-gradient(145deg, #0f172a 0%, #334155 55%, #0f172a 100%)',
    accent: '#94a3b8',
    label: 'Listing',
  },
}

export function placeholderToneForCategory(category: string | null | undefined): PlaceholderTone {
  if (!category) return CATEGORY_TONES.Other
  return CATEGORY_TONES[category] ?? CATEGORY_TONES.Other
}

export function withNormalizedListingImages<T extends { images?: unknown }>(
  listing: T,
): T & { images: string[] } {
  return { ...listing, images: normalizeListingImages(listing.images) }
}
