export type ProfileNameFields = {
  full_name?: string | null
  username?: string | null
  email?: string | null
  espeezy_email?: string | null
}

/** Resolve a human-readable name for invoices and receipts. */
export function resolveProfileDisplayName(profile: ProfileNameFields | null | undefined): string {
  if (!profile) return 'Unknown user'

  const full = profile.full_name?.trim()
  if (full) return full

  const username = profile.username?.trim()
  if (username) {
    return username.startsWith('@') ? username : `@${username}`
  }

  const email = (profile.email ?? profile.espeezy_email)?.trim()
  if (email) {
    const local = email.split('@')[0]?.trim()
    if (local) return local
  }

  return 'Unknown user'
}
