import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest, TokenPayload } from '@/lib/token';
import { roleHome } from '@/config/roles';

export function proxy(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/', '/api/auth/login'];
  if (publicRoutes.includes(pathname)) {
    if (token) {
      const user: TokenPayload | null = verifyToken(token);
      if (user) {
        return NextResponse.redirect(new URL(roleHome(user.role), request.url));
      }
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const user: TokenPayload | null = verifyToken(token);

  if (!user) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('token');
    return response;
  }

  const home = roleHome(user.role);
  if (!pathname.startsWith('/api/') && !pathname.startsWith(home)) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
