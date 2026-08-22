import bcrypt from 'bcryptjs';
import { supabase, Tables } from './supabase';

export type User = Tables<'users'>;

export const FACULTY_DEFAULT_PASSWORD =
    process.env.FACULTY_DEFAULT_PASSWORD || 'freshers@3128';

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function loginUser(email: string, password: string): Promise<User | null> {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        return null;
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
        return null;
    }

    return user;
}

export async function createUser(
    email: string,
    name: string,
    password: string,
    role: 'admin' | 'faculty',
    department?: string,
    section?: string
): Promise<User | null> {
    const password_hash = await hashPassword(password);

    const { data: user, error } = await supabase
        .from('users')
        .insert({
            email,
            name,
            password_hash,
            role,
            department,
            section
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating user:', error);
        return null;
    }

    return user;
}
