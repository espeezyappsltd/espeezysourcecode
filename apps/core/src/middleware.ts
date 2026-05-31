import { NextResponse, type NextRequest } from 'next/server'

/**
 * Local Server app has no protected dev-hub routes; pass through in all environments.
 * (Monorepo hub auth lives in the root app at /dashboard.)
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
