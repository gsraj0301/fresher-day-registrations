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

        const { data, error } = await supabase
            .from('counts')
            .upsert(
                {
                    department,
                    section,
                    student_count: student_count || 0,
                    additional_count: additional_count || 0,
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
