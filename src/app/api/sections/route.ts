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
            .from('sections')
            .select('*')
            .order('department')
            .order('section_name');

        if (error) {
            console.error('Error fetching sections:', error);
            return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
        }

        return NextResponse.json({ sections: data });
    } catch (error) {
        console.error('GET /api/sections error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
