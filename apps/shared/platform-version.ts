/**
 * Platform release version — set at build/deploy via release.json + env.
 */
export const PLATFORM_VERSION = process.env.NEXT_PUBLIC_PLATFORM_VERSION?.trim() || '1.0.0'

export const PLATFORM_RELEASE = process.env.NEXT_PUBLIC_PLATFORM_RELEASE?.trim() || 'v1'

export const PLATFORM_RELEASE_LABEL =
  process.env.NEXT_PUBLIC_PLATFORM_RELEASE_LABEL?.trim() || `Espeezy ${PLATFORM_RELEASE}`

export function formatPlatformVersionBadge(): string {
  return `${PLATFORM_RELEASE_LABEL} (${PLATFORM_VERSION})`
}
