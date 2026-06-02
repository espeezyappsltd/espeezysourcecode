import { NextResponse, type NextRequest } from 'next/server'

/** Espeezy Studios: no dev-hub session gate (unlike repo root hub app). */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
