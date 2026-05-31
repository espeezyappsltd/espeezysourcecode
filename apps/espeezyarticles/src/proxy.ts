import { NextResponse, type NextRequest } from 'next/server'

/** Espeezy Articles is a public content app — no dev-hub or dashboard auth gate. */
export function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
