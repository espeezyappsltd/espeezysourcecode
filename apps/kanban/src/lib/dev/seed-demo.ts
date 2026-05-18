export type SeedDemoSummary = {
  avatarsUpdated?: number
  postsCreated?: number
  hustleTasksCreated?: number
}

export async function seedDemoContent(): Promise<{
  ok: boolean
  summary?: SeedDemoSummary
  error?: string
}> {
  try {
    const res = await fetch('/api/dev/seed-demo', { method: 'POST', credentials: 'include' })
    const data = (await res.json()) as { ok?: boolean; summary?: SeedDemoSummary; error?: string }
    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Could not seed demo content.' }
    }
    return { ok: true, summary: data.summary }
  } catch {
    return { ok: false, error: 'Network error while seeding.' }
  }
}
