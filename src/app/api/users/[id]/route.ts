import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, getTokenFromRequest } from '@/lib/token';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
            return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });
        }

        const { id } = await params;

        if (id === user.id) {
            return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
        }

        const { data: target, error: fetchError } = await supabase
            .from('users')
            .select('id, role, email')
            .eq('id', id)
            .single();

        if (fetchError || !target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (target.role === 'admin') {
            return NextResponse.json({ error: 'Admin accounts cannot be deleted' }, { status: 403 });
        }

        await supabase
            .from('counts')
            .update({ updated_by: null })
            .eq('updated_by', id);

        const { data: deleted, error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .select('id');

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return NextResponse.json({ error: 'Failed to delete faculty' }, { status: 500 });
        }

        if (!deleted || deleted.length === 0) {
            return NextResponse.json(
                { error: 'Delete blocked by database (missing DELETE policy on users table). Run the SQL in FIX.md.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/users/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
