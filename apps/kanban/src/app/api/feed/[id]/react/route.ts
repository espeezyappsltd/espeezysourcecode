import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id: postId } = params
    const { reaction } = await req.json()
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
  } catch (err: any) {
    console.error('Reaction error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
