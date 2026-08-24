import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest, TokenPayload } from '@/lib/token';

export function proxy(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ['/', '/api/auth/login'];
  if (publicRoutes.includes(pathname)) {
    // If logged in and trying to access login, redirect to appropriate dashboard
    if (token) {
      const user: TokenPayload | null = verifyToken(token);
      if (user) {
        if (user.role === 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/faculty', request.url));
        }
      }
      // Invalid token, clear it
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
    return NextResponse.next();
  }

  // Protected routes need token
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify JWT token
  const user: TokenPayload | null = verifyToken(token);

  if (!user) {
    // Invalid or expired token, redirect to login
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('token');
    return response;
  }

  // Admin can only access /dashboard and /api/*
  if (user.role === 'admin' && !pathname.startsWith('/dashboard') && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Faculty can only access /faculty and /api/*
  if (user.role === 'faculty' && !pathname.startsWith('/faculty') && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/faculty', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
