import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Personal Storage Service
 * Handles user-specific asset uploads and management
 */
export class PersonalStorageService {
  private supabase

  constructor(token?: string) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    })
  }

  /**
   * Upload an asset to the user's private storage
   */
  async uploadAsset(file: File, path: string = '') {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Standard path: user_id/path/filename
    const cleanPath = path.replace(/^\/+|\/+$/g, '')
    const fullPath = `${user.id}/${cleanPath ? cleanPath + '/' : ''}${file.name}`

    const { data, error } = await this.supabase.storage
      .from('user-assets')
      .upload(fullPath, file, {
        upsert: true,
        contentType: file.type
      })

    if (error) throw error

    // Get public URL (or signed URL if bucket is private)
    const { data: { publicUrl } } = this.supabase.storage
      .from('user-assets')
      .getPublicUrl(fullPath)

    return {
      path: data.path,
      url: publicUrl,
      size: file.size
    }
  }

  /**
   * Delete an asset from storage
   */
  async deleteAsset(path: string) {
    const { error } = await this.supabase.storage
      .from('user-assets')
      .remove([path])
    
    if (error) throw error
  }

  /**
   * Seed a README.txt file if it doesn't exist
   */
  async seedReadme() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    const readmePath = `${user.id}/README.txt`
    
    // Check if exists
    const { data: existing } = await this.supabase.storage
      .from('user-assets')
      .list(user.id, { search: 'README.txt' })

    if (existing && existing.length > 0) return

    const content = `Welcome to your Espeezy Storage!
    
This is your private node for academic assets, design refs, and marketplace resources.
- Your storage quota is based on your current tier.
- You can organize assets into folders.
- Assets here can be linked to your public profile if you choose.

Happy building!`

    const file = new Blob([content], { type: 'text/plain' })
    
    await this.supabase.storage
      .from('user-assets')
      .upload(readmePath, file, { upsert: false })
  }
}
