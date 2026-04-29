import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
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
