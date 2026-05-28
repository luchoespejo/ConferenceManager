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
  const hostname = host.split(':')[0]; // strip port (localhost:3000 → localhost)
  const slug = hostname.split('.')[0];
  if (['www', 'tuplataforma', 'localhost', 'conference-manager-irl1', 'devflux'].includes(slug)) {
    return NextResponse.next();
  }

  // Rewrite: congreso.tuplataforma.com/programa → /congreso/programa
  const url = req.nextUrl.clone();
  url.pathname = `/${slug}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
