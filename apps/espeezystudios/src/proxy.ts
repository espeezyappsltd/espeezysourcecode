import { NextResponse, type NextRequest } from 'next/server'

/** Espeezy Studios: no dev-hub session gate (unlike repo root hub app). */
export function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [],
}
