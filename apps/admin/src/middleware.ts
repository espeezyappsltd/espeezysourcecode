import { NextResponse, type NextRequest } from 'next/server'
import { isPanelProductionHost } from '@shared/panel-app'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? ''
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  if (isPanelProductionHost(host)) {
    requestHeaders.set('x-espeezy-app', 'panel')
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/auth/:path*'],
}
