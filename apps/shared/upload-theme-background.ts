import type { SupabaseClient } from '@supabase/supabase-js'

const THEME_BG_BUCKET = 'espeezy-assets'

/** Upload a custom theme backdrop (same bucket path pattern as Kanban settings). */
export async function uploadThemeBackground(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const fileName = `${userId}-bg-${Date.now()}.jpg`
  const storagePath = `backgrounds/${fileName}`

  const { error } = await supabase.storage.from(THEME_BG_BUCKET).upload(storagePath, file, {
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from(THEME_BG_BUCKET).getPublicUrl(storagePath)

  return publicUrl
}
