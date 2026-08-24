import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, getTokenFromRequest } from '@/lib/token';
import { hashPassword, FACULTY_DEFAULT_PASSWORD } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromRequest(request);

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can view users' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, department, section, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        return NextResponse.json({ users: data });
    } catch (error) {
        console.error('GET /api/users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromRequest(request);

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
        }

        const { email, name, department, section } = await request.json();

        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email and name are required' },
                { status: 400 }
            );
        }

        const password_hash = await hashPassword(FACULTY_DEFAULT_PASSWORD);

        const { data, error } = await supabase
            .from('users')
            .insert({
                email,
                name,
                password_hash,
                role: 'faculty',
                department,
                section
            })
            .select('id, email, name, role, department, section, created_at')
            .single();

        if (error) {
            console.error('Error creating user:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        return NextResponse.json({ user: data });
    } catch (error) {
        console.error('POST /api/users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
