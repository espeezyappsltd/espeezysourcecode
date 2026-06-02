import { NextResponse, type NextRequest } from 'next/server'
import { HUB_SESSION_COOKIE, verifyHubSessionEdge } from '@/lib/dev-hub/auth-edge'

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.next({ request })
  }

  const { pathname } = request.nextUrl
  const isProtected =
    pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/api/dev') && !pathname.startsWith('/api/dev/auth'))

  if (!isProtected) {
    return NextResponse.next({ request })
  }

  const token = request.cookies.get(HUB_SESSION_COOKIE)?.value
  if (!(await verifyHubSessionEdge(token))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/dev/:path*'],
}
