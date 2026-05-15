import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id: postId } = await context.params
    const { reaction } = await request.json()
    const db = getAdminDb()

    // Upsert reaction: if same user+post, update reaction; else insert
    const { error } = await db
      .from('post_reactions')
      .upsert({
        post_id: postId,
        user_id: user.id,
        reaction: reaction
      }, { onConflict: 'post_id,user_id' })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error('Reaction error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
