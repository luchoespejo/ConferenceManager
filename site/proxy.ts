import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('admin_token')?.value;

  // ── Admin auth protection ────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Already logged in → redirect away from login page
  if (pathname === '/admin/login' && token) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // ── Subdomain → slug routing ─────────────────────────────────────────────
  const host = req.headers.get('host') ?? '';
  const slug = host.split('.')[0];
  if (['www', 'tuplataforma', 'localhost'].includes(slug)) {
    return NextResponse.next();
  }
  const res = NextResponse.next();
  res.headers.set('x-conference-slug', slug);
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
