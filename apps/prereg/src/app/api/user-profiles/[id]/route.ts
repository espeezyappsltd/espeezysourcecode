import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseConfig, isAdminRequest, normalizeUsername, supaRest } from '../../_lib/supabase-rest'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  username: z.string().trim().min(3).max(24).optional(),
  display_name: z.string().trim().max(120).optional(),
  avatar_url: z.string().url().max(500).optional(),
  app_role: z.enum(['user', 'moderator', 'admin']).optional(),
  is_banned: z.boolean().optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({
      error: 'Supabase is not configured.',
      message: 'Profile service is unavailable. Please try again later or contact support.'
    }, { status: 503 })
  }

  const { id } = await params
  const { ok, data, status } = await supaRest(
    `user_profiles?id=eq.${encodeURIComponent(id)}&select=*`,
    'GET',
  )

  if (!ok) {
    return NextResponse.json({
      error: 'Unable to fetch profile.',
      message: 'Could not load profile. Please refresh or contact support.',
      details: data
    }, { status })
  }

  const profile = Array.isArray(data) ? data[0] ?? null : null
  if (!profile) {
    return NextResponse.json({
      error: 'Profile not found.',
      message: 'No profile found for this user. Please check the ID or contact support.'
    }, { status: 404 })
  }

  return NextResponse.json({ profile })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({
      error: 'Forbidden.',
      message: 'You do not have permission to update this profile.'
    }, { status: 403 })
  }

  if (!getSupabaseConfig()) {
    return NextResponse.json({
      error: 'Supabase is not configured.',
      message: 'Profile service is unavailable. Please try again later or contact support.'
    }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid profile update payload.',
      message: 'Please check your input and try again.'
    }, { status: 422 })
  }

  const { id } = await params
  const updates = {
    ...parsed.data,
    ...(parsed.data.username ? { username: normalizeUsername(parsed.data.username) } : {}),
    updated_at: new Date().toISOString(),
  }

  const { ok, data, status } = await supaRest(
    `user_profiles?id=eq.${encodeURIComponent(id)}`,
    'PATCH',
    updates,
    { Prefer: 'return=representation' },
  )

  if (!ok) {
    return NextResponse.json({
      error: 'Unable to update profile.',
      message: 'Could not update profile. Please try again or contact support.',
      details: data
    }, { status })
  }

  const profile = Array.isArray(data) ? data[0] ?? null : null
  return NextResponse.json({ profile })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({
      error: 'Forbidden.',
      message: 'You do not have permission to delete this profile.'
    }, { status: 403 })
  }

  if (!getSupabaseConfig()) {
    return NextResponse.json({
      error: 'Supabase is not configured.',
      message: 'Profile service is unavailable. Please try again later or contact support.'
    }, { status: 503 })
  }

  const { id } = await params
  const { ok, data, status } = await supaRest(
    `user_profiles?id=eq.${encodeURIComponent(id)}`,
    'DELETE',
    undefined,
    { Prefer: 'return=representation' },
  )

  if (!ok) {
    return NextResponse.json({
      error: 'Unable to delete profile.',
      message: 'Could not delete profile. Please try again or contact support.',
      details: data
    }, { status })
  }

  return NextResponse.json({ success: true })
}
