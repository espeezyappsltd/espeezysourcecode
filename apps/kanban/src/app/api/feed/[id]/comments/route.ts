import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 200

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await context.params
    const db = getAdminDb()
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)),
    )

    const { data: rows, error } = await db
      .from('post_comments')
      .select('id, post_id, author_id, content, created_at, parent_id, edited_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      const missingTable =
        error.message.includes('post_comments') &&
        (error.message.includes('does not exist') || error.code === '42P01' || error.code === 'PGRST205')
      if (missingTable) {
        return NextResponse.json({ comments: [] })
      }
      throw error
    }

    const authorIds = Array.from(new Set((rows ?? []).map((r) => r.author_id).filter(Boolean)))
    const { data: authorRows } = authorIds.length
      ? await db
          .from('profiles')
          .select('id, full_name, username, avatar_url, role')
          .in('id', authorIds)
      : { data: [] as Array<{ id: string; full_name: string | null; username: string | null; avatar_url: string | null; role: string | null }> }

    const authorsById = new Map((authorRows ?? []).map((a) => [a.id, a]))
    const comments = (rows ?? []).map((row) => {
      const author = authorsById.get(row.author_id)
      return {
        ...row,
        author: author
          ? {
              id: author.id,
              full_name: author.full_name,
              ...(author.username ? { username: author.username } : {}),
              ...(author.avatar_url ? { avatar_url: author.avatar_url } : {}),
              ...(author.role ? { role: author.role } : {}),
            }
          : null,
      }
    })

    return NextResponse.json({ comments })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await context.params
    const body = (await request.json()) as { content?: string; parent_id?: string | null }
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    if (!content) {
      return NextResponse.json({ error: 'Comment content is required.' }, { status: 422 })
    }

    const db = getAdminDb()
    const { data: row, error } = await db
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
        parent_id: body.parent_id ?? null,
      })
      .select('id, post_id, author_id, content, created_at, parent_id, edited_at')
      .single()

    if (error) throw error

    const { data: author } = await db
      .from('profiles')
      .select('id, full_name, username, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle()

    const comment = {
      ...row,
      author: author
        ? {
            id: author.id,
            full_name: author.full_name,
            ...(author.username ? { username: author.username } : {}),
            ...(author.avatar_url ? { avatar_url: author.avatar_url } : {}),
            ...(author.role ? { role: author.role } : {}),
          }
        : null,
    }

    return NextResponse.json({ comment })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 })
  }
}
