import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'


const PAGE_SIZE = 20
const createPostSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  media_urls: z.array(z.string()).optional(),
  post_type: z.string().optional(),
  visibility: z.enum(['public', 'connections']).optional(),
  group_id: z.string().uuid().nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    const adminDb = getAdminDb()

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const filter = searchParams.get('filter') ?? 'public'

    let query = adminDb
      .from('posts')
      .select('id, author_id, content, media_urls, post_type, visibility, created_at, edited_at, group_id')
      .eq('is_deleted', false)
      .eq('visibility', filter === 'connections' ? 'connections' : 'public')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: postRows, error: postsError } = await query
    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    const postIds = (postRows ?? []).map(p => p.id)
    
    // Fetch reactions for these posts
    const { data: reactionRows } = postIds.length 
      ? await adminDb.from('post_reactions').select('post_id, user_id, reaction').in('post_id', postIds)
      : { data: [] }
    
    // Fetch comment counts
    // Note: In a larger app, we'd use a view or a more efficient count query
    const { data: commentCounts } = postIds.length
      ? await adminDb.from('post_comments').select('post_id').in('post_id', postIds)
      : { data: [] }

    const authorIds = Array.from(new Set((postRows ?? []).map((post) => post.author_id).filter(Boolean)))
    const { data: authorRows } = authorIds.length
      ? await adminDb
          .from('profiles')
          .select('id, full_name, username, avatar_url, role')
          .in('id', authorIds)
      : { data: [] as Array<{ id: string; full_name: string | null; username: string | null; avatar_url: string | null; role: string | null }> }

    const authorsById = new Map((authorRows ?? []).map((author) => [author.id, author]))
    const posts = (postRows ?? []).map((post) => {
      const author = authorsById.get(post.author_id)
      const postReactions = (reactionRows ?? []).filter(r => r.post_id === post.id)
      const postCommentCount = (commentCounts ?? []).filter(c => c.post_id === post.id).length

      return {
        ...post,
        author: author ? {
          id: author.id,
          full_name: author.full_name,
          ...(author.username ? { username: author.username } : {}),
          ...(author.avatar_url ? { avatar_url: author.avatar_url } : {}),
          ...(author.role ? { role: author.role } : {}),
        } : null,
        reactions: postReactions.map(r => ({ reaction: r.reaction, user_id: r.user_id })),
        comments: [{ count: postCommentCount }],
      }
    })

    return NextResponse.json({
      posts,
      nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].created_at : null,
    })
  } catch (err: any) {
    console.error('Feed Fetch Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminDb = getAdminDb()
    const uid = user.id

    // Check account is active
    const { data: profile, error: profileError } = await adminDb
      .from('profiles')
      .select('account_status')
      .eq('id', uid)
      .single()
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    if (profile?.account_status !== 'active' && profile?.account_status !== undefined) {
      return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 })
    }

    const parsedBody = createPostSchema.safeParse(await req.json())
    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.flatten() }, { status: 422 })
    }
    const { content, media_urls, post_type, visibility, group_id } = parsedBody.data

    const { data: post, error: postError } = await adminDb
      .from('posts')
      .insert({
        author_id: uid,
        content,
        media_urls: media_urls ?? [],
        post_type: post_type ?? 'general',
        visibility: visibility ?? 'public',
        group_id: group_id ?? null,
        is_deleted: false,
      })
      .select('id, author_id, content, media_urls, post_type, visibility, created_at, edited_at, group_id')
      .single()
    if (postError || !post) {
      return NextResponse.json({ error: postError?.message ?? 'Failed to create post' }, { status: 500 })
    }

    await adminDb.from('activity_logs').insert({
      user_id: uid,
      app_scope: 'feed',
      action: 'post.create',
      resource_type: 'posts',
      resource_id: post.id,
      details: { visibility: visibility ?? 'public', post_type: post_type ?? 'general' },
      status: 'success',
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (err: any) {
    console.error('Post creation error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
