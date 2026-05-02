/**
 * SUPABASE COMPATIBILITY SHIM (MIDDLEWARE)
 */
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Pass through as we migrate to Firebase auth middleware
  return NextResponse.next()
}
