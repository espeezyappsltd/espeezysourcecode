import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await context.params
    const db = getAdminDb()

    const { data: comments, error } = await db
      .from('post_comments')
      .select('id, content, created_at, parent_id, author:profiles(id, full_name, avatar_url, role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ comments })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await context.params
    const { content, parent_id } = await request.json()
    const db = getAdminDb()

    const { data: comment, error } = await db
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
        parent_id
      })
      .select('id, content, created_at, parent_id, author:profiles(id, full_name, avatar_url, role)')
      .single()

    if (error) throw error

    return NextResponse.json({ comment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
