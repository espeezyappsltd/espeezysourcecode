import { parsePhoneNumber } from 'libphonenumber-js'
import * as Flags from 'country-flag-icons/react/3x2'

/**
 * Detects the country code from a phone number string (e.g. +44 -> GB)
 */
export function detectCountry(phone: string): string | null {
  if (!phone || !phone.startsWith('+')) return null
  try {
    const phoneNumber = parsePhoneNumber(phone)
    return phoneNumber.country || null
  } catch {
    // Partial number detection logic for better UX while typing
    const digits = phone.replace(/\D/g, '')
    if (digits.length >= 1 && digits.length <= 4) {
      // Very crude fallback for common codes if full parsing fails during typing
      if (digits === '1') return 'US'
      if (digits === '44') return 'GB'
      if (digits === '254') return 'KE'
      if (digits === '91') return 'IN'
      if (digits === '33') return 'FR'
      if (digits === '49') return 'DE'
    }
    return null
  }
}

/**
 * Returns the SVG React component for a given country code
 */
export function getFlagComponent(countryCode: string | null | undefined): React.ComponentType | null {
  if (!countryCode) return null
  const code = countryCode.toUpperCase() as keyof typeof Flags
  return Flags[code] || null
}

/**
 * Returns the Unicode flag emoji for a given country code
 */
export function getUnicodeFlag(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return '🌐'
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
}
