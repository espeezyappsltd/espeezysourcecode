import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import crypto from 'crypto'
export const dynamic = 'force-dynamic'


const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Service Unavailable (Build)' }, { status: 503 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const filter = searchParams.get('filter') ?? 'public'

    let query: any = adminDb.collection('posts')
      .where('is_deleted', '==', false)
      .orderBy('created_at', 'desc')
      .limit(PAGE_SIZE)

    if (cursor) {
      query = query.startAfter(cursor)
    }

    if (filter === 'connections') {
      query = query.where('visibility', '==', 'connections')
    }

    const postsSnap = await query.get()
    const posts = await Promise.all(postsSnap.docs.map(async (doc: any) => {
      const data = doc.data()
      // Manual join for author
      const authorSnap = await adminDb.collection('profiles').doc(data.author_id).get()
      const author = authorSnap.exists ? authorSnap.data() : null
      
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at,
        author: author ? {
          id: authorSnap.id,
          full_name: author.full_name,
          username: author.username,
          avatar_url: author.avatar_url,
          role: author.role
        } : null
      }
    }))

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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Check account is active
    const profileSnap = await adminDb.collection('profiles').doc(uid).get()
    const profile = profileSnap.data()
    if (profile?.account_status !== 'active' && profile?.account_status !== undefined) {
      return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 })
    }

    const body = await req.json()
    const { content, media_urls, post_type, visibility, group_id } = body

    if (!content?.trim() || content.length > 2000) {
      return NextResponse.json({ error: 'Content required (max 2000 chars)' }, { status: 400 })
    }

    const postRef = await adminDb.collection('posts').add({
      author_id: uid,
      content: content.trim(),
      media_urls: media_urls ?? [],
      post_type: post_type ?? 'general',
      visibility: visibility ?? 'public',
      group_id: group_id ?? null,
      is_deleted: false,
      created_at: new Date().toISOString()
    })

    // Log activity (simplified)
    await adminDb.collection('activity_log').add({
      user_id: uid,
      action_type: 'post.create',
      resource: 'posts',
      resource_id: postRef.id,
      metadata: { visibility, post_type },
      created_at: new Date().toISOString()
    })

    const postSnap = await postRef.get()
    return NextResponse.json({ post: { id: postSnap.id, ...postSnap.data() } }, { status: 201 })
  } catch (err: any) {
    console.error('Post creation error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
