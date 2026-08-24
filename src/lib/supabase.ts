import { createClient } from '@supabase/supabase-js';
import type { Role } from '@/config/roles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    password_hash: string;
                    role: Role;
                    department: string | null;
                    section: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    name: string;
                    password_hash: string;
                    role: Role;
                    department?: string | null;
                    section?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    password_hash?: string;
                    role?: Role;
                    department?: string | null;
                    section?: string | null;
                    created_at?: string;
                };
            };
            sections: {
                Row: {
                    id: string;
                    department: string;
                    section_name: string;
                };
                Insert: {
                    id?: string;
                    department: string;
                    section_name: string;
                };
                Update: {
                    id?: string;
                    department?: string;
                    section_name?: string;
                };
            };
            counts: {
                Row: {
                    id: string;
                    department: string;
                    section: string;
                    student_count: number;
                    additional_count: number;
                    total: number;
                    updated_at: string;
                    updated_by: string | null;
                };
                Insert: {
                    id?: string;
                    department: string;
                    section: string;
                    student_count?: number;
                    additional_count?: number;
                    total?: number;
                    updated_at?: string;
                    updated_by?: string | null;
                };
                Update: {
                    id?: string;
                    department?: string;
                    section?: string;
                    student_count?: number;
                    additional_count?: number;
                    total?: number;
                    updated_at?: string;
                    updated_by?: string | null;
                };
            };
        };
    };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
