import { NextResponse, type NextRequest } from 'next/server'

/** Prereg is a public marketing app — no dev-hub or dashboard auth here. */
export function middleware(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
