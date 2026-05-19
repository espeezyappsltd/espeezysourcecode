import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import {
  accountPostingBlockedMessage,
  isAccountPostingBlocked,
} from '@/lib/platform/account-status'
import { feedPostUpdateSchema } from '@/lib/feed/post-schema'

export const dynamic = 'force-dynamic'

const POST_SELECT =
  'id, author_id, content, media_urls, post_type, visibility, created_at, edited_at, group_id, is_deleted'

async function loadPost(adminDb: ReturnType<typeof getAdminDb>, postId: string) {
  const { data, error } = await adminDb.from('posts').select(POST_SELECT).eq('id', postId).maybeSingle()
  if (error) return { error: error.message, post: null as null }
  return { error: null, post: data }
}

async function loadAuthor(adminDb: ReturnType<typeof getAdminDb>, authorId: string) {
  const { data } = await adminDb
    .from('profiles')
    .select('id, full_name, username, avatar_url, role')
    .eq('id', authorId)
    .maybeSingle()
  return data
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const adminDb = getAdminDb()
    const { post, error } = await loadPost(adminDb, id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!post || post.is_deleted) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const author = await loadAuthor(adminDb, post.author_id)
    return NextResponse.json({
      post: {
        ...post,
        author: author
          ? {
              id: author.id,
              full_name: author.full_name,
              ...(author.username ? { username: author.username } : {}),
              ...(author.avatar_url ? { avatar_url: author.avatar_url } : {}),
              ...(author.role ? { role: author.role } : {}),
            }
          : null,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const parsed = feedPostUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const adminDb = getAdminDb()
    const { post: existing, error: loadError } = await loadPost(adminDb, id)
    if (loadError) return NextResponse.json({ error: loadError }, { status: 500 })
    if (!existing || existing.is_deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (existing.author_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own posts.' }, { status: 403 })
    }

    const { data: profile } = await adminDb.from('profiles').select('account_status').eq('id', user.id).single()
    if (isAccountPostingBlocked(profile?.account_status)) {
      return NextResponse.json({ error: accountPostingBlockedMessage(profile?.account_status) }, { status: 403 })
    }

    const patch: Record<string, unknown> = { edited_at: new Date().toISOString() }
    if (parsed.data.content !== undefined) patch.content = parsed.data.content
    if (parsed.data.media_urls !== undefined) patch.media_urls = parsed.data.media_urls
    if (parsed.data.post_type !== undefined) patch.post_type = parsed.data.post_type
    if (parsed.data.visibility !== undefined) patch.visibility = parsed.data.visibility
    if (parsed.data.group_id !== undefined) patch.group_id = parsed.data.group_id

    const { data: post, error: updateError } = await adminDb
      .from('posts')
      .update(patch)
      .eq('id', id)
      .eq('author_id', user.id)
      .select(POST_SELECT)
      .single()

    if (updateError || !post) {
      return NextResponse.json({ error: updateError?.message ?? 'Update failed' }, { status: 500 })
    }

    await adminDb.from('activity_logs').insert({
      user_id: user.id,
      app_scope: 'feed',
      action: 'post.update',
      resource_type: 'posts',
      resource_id: id,
      details: { visibility: post.visibility },
      status: 'success',
    })

    const author = await loadAuthor(adminDb, post.author_id)
    return NextResponse.json({
      post: {
        ...post,
        author: author
          ? {
              id: author.id,
              full_name: author.full_name,
              ...(author.username ? { username: author.username } : {}),
              ...(author.avatar_url ? { avatar_url: author.avatar_url } : {}),
              ...(author.role ? { role: author.role } : {}),
            }
          : null,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const adminDb = getAdminDb()
    const { post: existing, error: loadError } = await loadPost(adminDb, id)
    if (loadError) return NextResponse.json({ error: loadError }, { status: 500 })
    if (!existing || existing.is_deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (existing.author_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own posts.' }, { status: 403 })
    }

    const { error: deleteError } = await adminDb
      .from('posts')
      .update({ is_deleted: true, edited_at: new Date().toISOString() })
      .eq('id', id)
      .eq('author_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    await adminDb.from('activity_logs').insert({
      user_id: user.id,
      app_scope: 'feed',
      action: 'post.delete',
      resource_type: 'posts',
      resource_id: id,
      details: {},
      status: 'success',
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
