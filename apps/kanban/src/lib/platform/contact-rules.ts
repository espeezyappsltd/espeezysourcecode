/**
 * Marketplace & peer messaging rules — enforced server-side and surfaced in UI.
 */

export const PLATFORM_CONTACT_RULES = [
  'Messages must relate to the listing or a legitimate campus transaction.',
  'No harassment, spam, or off-platform payment requests.',
  'Meet in public campus locations; Espeezy does not broker in-person safety.',
  'Report abuse via Settings → Support. Suspended accounts cannot message.',
] as const

export type ContactValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

export function validateMarketplaceContact(input: {
  senderId: string
  recipientId: string
  message: string
  listingId?: string | null
  listingOwnerId?: string | null
  listingStatus?: string | null
  senderAccountStatus?: string | null
}): ContactValidationResult {
  if (!input.senderId || !input.recipientId) {
    return { ok: false, code: 'invalid', message: 'Invalid contact request.' }
  }

  if (input.senderId === input.recipientId) {
    return { ok: false, code: 'self', message: 'You cannot message yourself.' }
  }

  const status = input.senderAccountStatus ?? 'active'
  if (status !== 'active' && status !== undefined) {
    return {
      ok: false,
      code: 'suspended',
      message: 'Your account cannot send messages. Contact support.',
    }
  }

  const body = input.message.trim()
  if (body.length < 2) {
    return { ok: false, code: 'empty', message: 'Write a short message about the listing.' }
  }
  if (body.length > 4000) {
    return { ok: false, code: 'long', message: 'Message is too long.' }
  }

  const blocked = /\b(crypto|wire transfer|whatsapp only|telegram only|send nudes)\b/i
  if (blocked.test(body)) {
    return {
      ok: false,
      code: 'policy',
      message: 'This message violates Espeezy communication policy.',
    }
  }

  if (input.listingId) {
    if (!input.listingOwnerId || input.listingOwnerId !== input.recipientId) {
      return {
        ok: false,
        code: 'listing_mismatch',
        message: 'This listing is not owned by that seller.',
      }
    }
    const st = (input.listingStatus ?? 'AVAILABLE').toUpperCase()
    if (st === 'SOLD') {
      return {
        ok: false,
        code: 'sold',
        message: 'This item is sold. You can still view the seller profile.',
      }
    }
  }

  return { ok: true }
}

export function avatarUrlForProfile(profile: {
  id: string
  full_name?: string | null
  username?: string | null
  avatar_url?: string | null
}): string {
  if (profile.avatar_url?.trim()) return profile.avatar_url.trim()
  const label = encodeURIComponent(profile.full_name || profile.username || 'Student')
  return `https://ui-avatars.com/api/?name=${label}&background=059669&color=fff&size=128&bold=true`
}
