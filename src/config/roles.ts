export const LEADERSHIP_ROLES = ['principal', 'hod', 'dean_admission', 'dean_academics'] as const;

export type LeadershipRole = (typeof LEADERSHIP_ROLES)[number];

export type Role = 'admin' | LeadershipRole | 'faculty';

export const ROLE_LABELS: Record<Role, string> = {
    admin: 'Administrator',
    principal: 'Principal',
    hod: 'HOD',
    dean_admission: 'Dean Admissions',
    dean_academics: 'Dean Academics',
    faculty: 'Faculty'
};

export function isLeadership(role: string): role is LeadershipRole {
    return (LEADERSHIP_ROLES as readonly string[]).includes(role);
}

export function roleHome(role: string): '/dashboard' | '/overview' | '/faculty' {
    if (role === 'admin') return '/dashboard';
    if (isLeadership(role)) return '/overview';
    return '/faculty';
}

export function canManageFaculty(role: string): boolean {
    return role === 'admin';
}
