import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const hostname = req.headers.get('host') || ''

  // Subdomain for the admin dashboard (production only)
  const isTeamDynamics = hostname === 'teamdynamics.espeezy.com' || hostname.startsWith('teamdynamics.localhost');
  const isKanban = hostname === 'kanban.espeezy.com' || hostname.startsWith('kanban.localhost');

  // If on main domain and they try to access /admin, redirect to teamdynamics subdomain (production only)
  if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    // Redirect apex to teamdynamics (though Caddy already does this, middleware is a good backup)
    if (hostname === 'espeezy.com' || hostname === 'www.espeezy.com') {
      url.host = 'teamdynamics.espeezy.com'
      return NextResponse.redirect(url)
    }

    // Ensure /admin is only on teamdynamics
    if (url.pathname.startsWith('/admin') && !isTeamDynamics) {
      url.host = 'teamdynamics.espeezy.com'
      return NextResponse.redirect(url)
    }

    // Redirect /dashboard to kanban.espeezy.com (the MAIN DASHBOARD)
    if (url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/')) {
      url.host = 'kanban.espeezy.com'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any file with an extension (e.g. .svg, .png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
