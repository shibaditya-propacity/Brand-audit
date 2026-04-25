import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/audit'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected  = PROTECTED.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Cookie existence check — full JWT verification happens in API routes / server components
  const token = req.cookies.get('pa_token')?.value;
  if (token) return NextResponse.next();

  // Redirect unauthenticated users back to home with modal trigger params
  const url = req.nextUrl.clone();
  url.pathname = '/';
  url.searchParams.set('authRequired', '1');
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
