import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest, TokenPayload } from '@/lib/token';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user: TokenPayload | null = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}
