import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, getTokenFromRequest } from '@/lib/token';

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

        const { data, error } = await supabase
            .from('counts')
            .select('*')
            .order('department')
            .order('section');

        if (error) {
            console.error('Error fetching counts:', error);
            return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
        }

        return NextResponse.json({ counts: data });
    } catch (error) {
        console.error('GET /api/counts error:', error);
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

        const { department, section, student_count, additional_count } = await request.json();

        if (!department || !section) {
            return NextResponse.json(
                { error: 'Department and section are required' },
                { status: 400 }
            );
        }

        const sc = student_count ?? 0;
        const ac = additional_count ?? 0;
        if (sc < 0 || sc > 1000 || ac < 0 || ac > 1000) {
            return NextResponse.json(
                { error: 'Counts must be between 0 and 1000' },
                { status: 400 }
            );
        }

        if (user.role === 'faculty') {
            if (user.department !== department || user.section !== section) {
                return NextResponse.json(
                    { error: 'Faculty can only update their assigned section' },
                    { status: 403 }
                );
            }
        }

        const { data, error } = await supabase
            .from('counts')
            .upsert(
                {
                    department,
                    section,
                    student_count: sc,
                    additional_count: ac,
                    updated_by: user.id,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'department,section' }
            )
            .select()
            .single();

        if (error) {
            console.error('Error upserting count:', error);
            return NextResponse.json({ error: 'Failed to update count' }, { status: 500 });
        }

        return NextResponse.json({ count: data });
    } catch (error) {
        console.error('POST /api/counts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
