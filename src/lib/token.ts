import jwt from 'jsonwebtoken';

const JWT_SECRET =
    process.env.JWT_SECRET || 'freshers-day-counter-dev-secret';
const TOKEN_EXPIRY = '2d';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn(
        'WARNING: JWT_SECRET is not set. Using insecure development fallback — set JWT_SECRET in your environment!'
    );
}

export interface TokenPayload {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'faculty';
    department?: string | null;
    section?: string | null;
}

export function generateToken(user: TokenPayload): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            section: user.section
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch {
        return null;
    }
}

export function getTokenFromRequest(request: Request): string | null {
    const cookie = request.headers.get('cookie');
    if (!cookie) return null;
    for (const part of cookie.split(';')) {
        const [name, ...rest] = part.trim().split('=');
        if (name === 'token') return decodeURIComponent(rest.join('='));
    }
    return null;
}
