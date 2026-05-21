export const STORAGE_QUOTAS_BYTES: Record<string, number> = {
  free: 1024 * 1024 * 1024,
  pro: 5 * 1024 * 1024 * 1024,
  premium: 20 * 1024 * 1024 * 1024,
  lifetime: 20 * 1024 * 1024 * 1024,
  admin: 100 * 1024 * 1024 * 1024,
}

export function resolveStoragePlan(
  profile: { subscription_plan?: string | null; tier?: string | null } | null | undefined,
): string {
  return (profile?.subscription_plan ?? profile?.tier ?? 'free').toLowerCase()
}

export function getStorageQuotaBytes(plan: string): number {
  return STORAGE_QUOTAS_BYTES[plan] ?? STORAGE_QUOTAS_BYTES.free
}

export function formatStorageBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
